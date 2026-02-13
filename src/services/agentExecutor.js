const formatForModel = require('./historyFormatter').formatForModel;
const memoryService = require('./memoryService');
const { sanitizeForPrompt } = require('../utils/sanitize');
const fs = require('fs');
const path = require('path');

const MODEL_CALL_TIMEOUT_MS = 10000;
const EXTERNAL_AGENT_TIMEOUT = parseInt(process.env.EXTERNAL_AGENT_TIMEOUT, 10) || 10000;
const MAX_RESPONSE_LENGTH = parseInt(process.env.MAX_MESSAGE_LENGTH, 10) || 800;
const SAVE_CONVERSATIONS = process.env.SAVE_CONVERSATIONS_TO_DISK === 'true';

function ensureArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Build personality-aware system prompt for conversation — casual, short, human-like. */
function buildSystemContent(agent) {
  // Sanitize all user-controlled fields before injecting into the prompt
  const name = sanitizeForPrompt(agent.name || 'Agent');
  const bio = sanitizeForPrompt(agent.bio || agent.description || '');
  const hobbies = ensureArray(agent.hobbies).map(sanitizeForPrompt);
  const traits = ensureArray(agent.personality_traits).map(sanitizeForPrompt);

  let text = `You are ${name}.`;
  if (bio) text += ` ${bio}`;
  if (hobbies.length) text += ` Your interests: ${hobbies.join(', ')}.`;
  if (traits.length) text += ` Your vibe: ${traits.join(', ')}.`;

  text += `

CONVERSATION RULES (follow strictly):
- Talk like you're texting a friend. Casual, chill, natural.
- Keep messages SHORT: 1-2 sentences max. Never write paragraphs.
- Use lowercase freely, slang is fine, abbreviations okay.
- React naturally — laugh, joke, tease, be curious.
- Ask questions to keep the convo going.
- NO essays. NO bullet points. NO formal language. NO monologues.
- NO meta-commentary about being an AI or agent.
- Stay in character with your personality and quirks.
- Hard limit: 300 characters ideal, 500 max.`;

  return text;
}

function truncateIfNeeded(content) {
  if (!content) return content;
  if (content.length <= MAX_RESPONSE_LENGTH) return content;
  console.warn(`[Agent] Response truncated from ${content.length} to ${MAX_RESPONSE_LENGTH} characters`);
  return content.slice(0, MAX_RESPONSE_LENGTH);
}

function logOutgoing(agentId, url, payload) {
  console.log(`[External] OUT agent=${agentId} url=${url} history_len=${payload.conversation_history?.length}`);
  if (SAVE_CONVERSATIONS) {
    const dir = path.join(process.cwd(), 'logs', 'conversations');
    try {
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `out-${payload.session_id}-${Date.now()}.json`);
      fs.writeFileSync(file, JSON.stringify(payload, null, 2));
    } catch (e) {
      console.warn('[External] Failed to save outgoing:', e.message);
    }
  }
}

function logIncoming(agentId, status, body, error, sessionId) {
  if (error) {
    console.error(`[External] ERR agent=${agentId} ${error.message}`);
  } else {
    console.log(`[External] IN agent=${agentId} status=${status} response_len=${body?.response?.length ?? 0}`);
  }
  if (SAVE_CONVERSATIONS && body) {
    const dir = path.join(process.cwd(), 'logs', 'conversations');
    try {
      fs.mkdirSync(dir, { recursive: true });
      const prefix = sessionId ? `in-${sessionId}` : `in-${agentId}`;
      const file = path.join(dir, `${prefix}-${Date.now()}.json`);
      fs.writeFileSync(file, JSON.stringify(body, null, 2));
    } catch (e) {
      console.warn('[External] Failed to save incoming:', e.message);
    }
  }
}

function toAgentProfile(agent) {
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    model_provider: agent.model_provider,
    model_name: agent.model_name,
    temperature: agent.temperature,
    capabilities: agent.capabilities,
    goals: agent.goals,
  };
}

async function callWebhook(agent, conversationHistory, sessionId) {
  const url = agent.webhook_url?.trim();
  if (!url) {
    throw new Error('External agent missing webhook_url');
  }

  const pastMemories = await memoryService.getRecentMemories(agent.id, 5);

  const payload = {
    conversation_history: conversationHistory.map((m) => ({
      content: m.content,
      sender_agent_id: m.sender_agent_id,
    })),
    agent_profile: toAgentProfile(agent),
    session_id: sessionId,
    past_memories: pastMemories,
  };

  logOutgoing(agent.id, url, payload);

  const timeoutMs = Math.min(EXTERNAL_AGENT_TIMEOUT, 10000);

  const attempt = async (isRetry = false) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();

      if (!response.ok) {
        logIncoming(agent.id, response.status, null, new Error(`Webhook error: ${response.status}`), sessionId);
        throw new Error(`Webhook error: ${response.status} ${text}`);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        logIncoming(agent.id, response.status, null, new Error('Invalid JSON'), sessionId);
        throw new Error('Webhook did not return valid JSON');
      }

      logIncoming(agent.id, response.status, data, null, sessionId);

      const content = data.response?.trim() || '';
      return truncateIfNeeded(content);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        logIncoming(agent.id, null, null, new Error(`Timeout after ${timeoutMs}ms`), sessionId);
        const timeoutErr = new Error(`External agent timed out after ${timeoutMs}ms`);
        timeoutErr.statusCode = 408;
        throw timeoutErr;
      }
      logIncoming(agent.id, null, null, err, sessionId);
      throw err;
    }
  };

  try {
    return await attempt();
  } catch (err) {
    console.warn('[External] First attempt failed:', err.message);
    return attempt(true);
  }
}

async function callGemini(agent, conversationHistory) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const recentMemories = await memoryService.getRecentMemories(agent.id, 5);
  let systemContent = buildSystemContent(agent);
  if (recentMemories.length > 0) {
    const safeMemories = recentMemories.map(sanitizeForPrompt);
    systemContent += `\n\nPast memories of this agent:\n${safeMemories.join('\n')}`;
  }

  const contents = conversationHistory.map((m) => ({
    role: m.sender_agent_id === agent.id ? 'model' : 'user',
    parts: [{ text: sanitizeForPrompt(m.content) }],
  }));

  const model = agent.model_name || 'gemini-2.0-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MODEL_CALL_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemContent }] },
        contents: contents.length ? contents : [{ role: 'user', parts: [{ text: 'Hello. Introduce yourself briefly.' }] }],
        generationConfig: {
          temperature: agent.temperature ?? 0.7,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || JSON.stringify(data);
      throw new Error(`Gemini API error: ${response.status} - ${errMsg}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const content = (text || '').trim();
    return truncateIfNeeded(content);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Gemini call timed out after 10 seconds');
      timeoutErr.statusCode = 408;
      throw timeoutErr;
    }
    throw err;
  }
}

async function callOpenAI(agent, conversationHistory) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const recentMemories = await memoryService.getRecentMemories(agent.id, 5);
  let systemContent = buildSystemContent(agent);
  if (recentMemories.length > 0) {
    const safeMemories = recentMemories.map(sanitizeForPrompt);
    systemContent += `\n\nPast memories of this agent:\n${safeMemories.join('\n')}`;
  }

  const messages = [
    { role: 'system', content: systemContent },
    ...formatForModel(conversationHistory),
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MODEL_CALL_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: agent.model_name || 'gpt-4',
        messages,
        temperature: agent.temperature ?? 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errBody}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    return truncateIfNeeded(content);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Model call timed out after 10 seconds');
      timeoutErr.statusCode = 408;
      throw timeoutErr;
    }
    throw err;
  }
}

async function executeAgent(agent, conversationHistory, sessionId) {
  const agentType = (agent.agent_type || 'internal').toLowerCase();

  if (agentType === 'external') {
    return callWebhook(agent, conversationHistory, sessionId);
  }

  if (agent.model_provider === 'local') {
    return 'Local agent response';
  }

  if (agent.model_provider === 'gemini') {
    return callGemini(agent, conversationHistory);
  }

  if (agent.model_provider === 'openai') {
    return callOpenAI(agent, conversationHistory);
  }

  throw new Error(`Unsupported model_provider: ${agent.model_provider}`);
}

module.exports = {
  executeAgent,
  MAX_RESPONSE_LENGTH,
};
