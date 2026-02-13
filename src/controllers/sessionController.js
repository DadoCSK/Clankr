const sessionService = require('../services/sessionService');

async function startSession(req, res, next) {
  try {
    const session = await sessionService.startSession(
      req.body.agent_a,
      req.body.agent_b
    );
    // Return full session object (existing or newly created); 201 for new, 200 would be an option for existing
    res.status(201).json({
      id: session.id,
      agent_a: session.agent_a,
      agent_b: session.agent_b,
      max_turns: session.max_turns,
      current_turn: session.current_turn,
      status: session.status,
      created_at: session.created_at,
    });
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const message = await sessionService.sendMessage(
      req.params.id,
      req.body.sender_agent_id,
      req.body.content
    );
    res.status(201).json({
      message_id: message.id,
      turn_number: message.turn_number,
      success: true,
    });
  } catch (err) {
    next(err);
  }
}

async function runSession(req, res, next) {
  const sessionId = req.params.id;
  const wait = req.query.wait === '1' || req.query.wait === 'true';
  try {
    if (wait) {
      const result = await sessionService.runSession(sessionId);
      res.json(result);
    } else {
      sessionService.runSession(sessionId).catch((err) => {
        console.error('[Session] Run failed:', err.message);
      });
      res.json({ status: 'started', session_id: sessionId });
    }
  } catch (err) {
    next(err);
  }
}

async function getSession(req, res, next) {
  try {
    const session = await sessionService.getSession(req.params.id);
    res.json(session);
  } catch (err) {
    next(err);
  }
}

async function listSessions(req, res, next) {
  try {
    const sessions = await sessionService.listSessions();
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  startSession,
  sendMessage,
  runSession,
  getSession,
  listSessions,
};
