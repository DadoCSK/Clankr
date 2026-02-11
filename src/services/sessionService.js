const agentModel = require('../models/agent');
const sessionModel = require('../models/session');
const messageModel = require('../models/message');
const trustModel = require('../models/trust');
const agentExecutor = require('./agentExecutor');
const sessionSummarizer = require('./sessionSummarizer');
const sessionEvaluator = require('./sessionEvaluator');
const memoryService = require('./memoryService');

async function startSession(agentA, agentB) {
  const [a, b] = await Promise.all([
    agentModel.findById(agentA),
    agentModel.findById(agentB),
  ]);

  if (!a || !b) {
    const error = new Error('One or both agents not found');
    error.statusCode = 404;
    throw error;
  }

  const maxTurns = Math.min(a.max_session_length || 50, b.max_session_length || 50);
  return sessionModel.create(agentA, agentB, maxTurns);
}

async function sendMessage(sessionId, senderAgentId, content) {
  const session = await sessionModel.findById(sessionId);
  if (!session) {
    const error = new Error('Session not found');
    error.statusCode = 404;
    throw error;
  }

  if (session.status !== 'active') {
    const error = new Error('Session has ended');
    error.statusCode = 400;
    throw error;
  }

  const isParticipant =
    session.agent_a === senderAgentId || session.agent_b === senderAgentId;
  if (!isParticipant) {
    const error = new Error('Agent is not a participant in this session');
    error.statusCode = 403;
    throw error;
  }

  if (session.current_turn >= session.max_turns) {
    const error = new Error('Session turn limit reached');
    error.statusCode = 400;
    throw error;
  }

  const turnNumber = session.current_turn + 1;
  const message = await messageModel.create(
    sessionId,
    senderAgentId,
    content,
    turnNumber
  );
  await sessionModel.incrementTurn(sessionId);

  const updatedSession = await sessionModel.findById(sessionId);
  if (updatedSession.current_turn >= updatedSession.max_turns) {
    await sessionModel.endSession(sessionId);
  }

  return message;
}

const REPEAT_THRESHOLD = 5;

function hasRepeatedMessage(messages) {
  if (messages.length < REPEAT_THRESHOLD) return false;
  const last = messages.slice(-REPEAT_THRESHOLD);
  const content = last[0].content;
  const isRepeat = last.every((m) => m.content === content);
  if (isRepeat) {
    console.log(`[Session] Stopping early: last ${REPEAT_THRESHOLD} messages are identical`);
  }
  return isRepeat;
}

async function runSession(sessionId) {
  const session = await sessionModel.findById(sessionId);
  if (!session) {
    const error = new Error('Session not found');
    error.statusCode = 404;
    throw error;
  }

  if (session.status !== 'active') {
    const error = new Error('Session is not active');
    error.statusCode = 400;
    throw error;
  }

  const [agentA, agentB] = await Promise.all([
    agentModel.findById(session.agent_a),
    agentModel.findById(session.agent_b),
  ]);

  if (!agentA || !agentB) {
    const error = new Error('One or both agents not found');
    error.statusCode = 404;
    throw error;
  }

  let messages = await messageModel.findBySessionId(sessionId);

  while (session.current_turn < session.max_turns) {
    const isAgentATurn = session.current_turn % 2 === 0;
    const activeAgent = isAgentATurn ? agentA : agentB;
    const senderAgentId = activeAgent.id;

    const conversationHistory = messages.map((m) => ({
      content: m.content,
      sender_agent_id: m.sender_agent_id,
    }));

    let response;
    try {
      response = await agentExecutor.executeAgent(activeAgent, conversationHistory, sessionId);
    } catch (err) {
      await sessionModel.endSession(sessionId);
      throw err;
    }

    if (!response || !response.trim()) {
      console.log(`[Session] Stopping early: agent returned empty response at turn ${session.current_turn + 1}`);
      break;
    }

    const turnNumber = session.current_turn + 1;
    await messageModel.create(sessionId, senderAgentId, response.trim(), turnNumber);
    await sessionModel.incrementTurn(sessionId);

    messages = await messageModel.findBySessionId(sessionId);
    Object.assign(session, await sessionModel.findById(sessionId));

    if (hasRepeatedMessage(messages)) {
      break;
    }
  }

  await sessionModel.endSession(sessionId);
  const finalMessages = await messageModel.findBySessionId(sessionId);

  if (finalMessages.length > 0) {
    const summary = await sessionSummarizer.summarizeSession(finalMessages);
    if (summary) {
      await memoryService.storeMemory(session.agent_a, summary);
      await memoryService.storeMemory(session.agent_b, summary);
    }

    const sessionScore = await sessionEvaluator.evaluateSession(finalMessages);
    const isSuccess = sessionScore > 0.6;

    await agentModel.updateReputation(session.agent_a, isSuccess);
    await agentModel.updateReputation(session.agent_b, isSuccess);

    await trustModel.updateTrust(session.agent_a, session.agent_b, sessionScore);
    await trustModel.updateTrust(session.agent_b, session.agent_a, sessionScore);
  }

  return {
    session_id: sessionId,
    status: 'ended',
    turns_completed: session.current_turn,
    messages: finalMessages,
  };
}

async function listSessions() {
  const sessions = await sessionModel.findAll();
  const enriched = await Promise.all(
    sessions.map(async (s) => {
      const [agentA, agentB] = await Promise.all([
        agentModel.findById(s.agent_a),
        agentModel.findById(s.agent_b),
      ]);
      return {
        ...s,
        agent_a_name: agentA?.name ?? 'Unknown',
        agent_b_name: agentB?.name ?? 'Unknown',
      };
    })
  );
  return enriched;
}

async function getSession(sessionId) {
  const session = await sessionModel.findById(sessionId);
  if (!session) {
    const error = new Error('Session not found');
    error.statusCode = 404;
    throw error;
  }

  const [messages, agentA, agentB] = await Promise.all([
    messageModel.findBySessionId(sessionId),
    agentModel.findById(session.agent_a),
    agentModel.findById(session.agent_b),
  ]);

  return {
    ...session,
    agent_a_name: agentA?.name ?? 'Unknown',
    agent_b_name: agentB?.name ?? 'Unknown',
    messages,
  };
}

module.exports = {
  startSession,
  sendMessage,
  runSession,
  getSession,
  listSessions,
};
