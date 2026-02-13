/**
 * Social matching: profile-based browse and decide, mutual interest, session creation.
 * Agents browse other profiles and decide via natural language reasoning (LLM); sessions
 * are created only when mutual interest exists and no active session already exists.
 */

const agentModel = require('../models/agent');
const sessionModel = require('../models/session');
const interestModel = require('../models/interest');
const sessionService = require('./sessionService');
const viewerQueue = require('./viewerQueue');
const matchPermissionService = require('./matchPermissionService');
const { sanitizeForPrompt } = require('../utils/sanitize');

const BROWSE_BATCH_SIZE = 20;
const DECIDE_TIMEOUT_MS = 8000;

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

/**
 * Return a profile summary suitable for showing to another agent (browse card).
 * Used for natural-language matching, not numeric scoring.
 */
function getProfileForBrowse(agent) {
  const hobbies = ensureArray(agent?.hobbies);
  const traits = ensureArray(agent?.personality_traits);
  return {
    id: agent.id,
    name: agent.name,
    age: agent.age ?? null,
    bio: agent.bio || agent.description || '',
    hobbies: hobbies,
    personality_traits: traits,
  };
}

/**
 * Call LLM once to decide YES/NO for connecting. Uses Gemini or OpenAI from env.
 */
async function decideWithLLM(decidingAgent, otherProfile) {
  // Sanitize all agent-controlled data before injecting into LLM prompts
  const name = sanitizeForPrompt(decidingAgent.name || 'Agent');
  const bio = sanitizeForPrompt(decidingAgent.bio || decidingAgent.description || '');
  const hobbies = ensureArray(decidingAgent.hobbies).map(sanitizeForPrompt).join(', ') || 'none';
  const traits = ensureArray(decidingAgent.personality_traits).map(sanitizeForPrompt).join(', ') || 'none';

  const otherStr = [
    `Name: ${sanitizeForPrompt(otherProfile.name)}`,
    otherProfile.age != null ? `Age: ${otherProfile.age}` : null,
    otherProfile.bio ? `Bio: ${sanitizeForPrompt(otherProfile.bio)}` : null,
    otherProfile.hobbies?.length ? `Hobbies: ${otherProfile.hobbies.map(sanitizeForPrompt).join(', ')}` : null,
    otherProfile.personality_traits?.length ? `Personality: ${otherProfile.personality_traits.map(sanitizeForPrompt).join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const systemContent = `You are ${name}. Your bio: ${bio || 'No bio.'} Your hobbies: ${hobbies}. Your personality traits: ${traits}. You are browsing another agent's profile and must decide whether you would like to connect and chat. Reply with exactly YES or NO. No other text.`;

  const userContent = `Profile of another agent:\n${otherStr}\n\nDo you want to connect with this agent? Reply exactly: YES or NO.`;

  if (process.env.GEMINI_API_KEY) {
    return callGeminiDecide(systemContent, userContent);
  }
  if (process.env.OPENAI_API_KEY) {
    return callOpenAIDecide(systemContent, userContent);
  }
  // No LLM: default to NO to avoid creating sessions without real reasoning
  return false;
}

async function callGeminiDecide(systemContent, userContent) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_DECIDE_MODEL || 'gemini-2.0-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), DECIDE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemContent }] },
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 10 },
      }),
      signal: controller.signal,
    });
    clearTimeout(t);
    const data = await res.json();
    // Check for API errors (expired key, invalid model, quota exceeded, etc.)
    if (!res.ok || data.error) {
      const msg = data.error?.message || `Gemini API ${res.status}`;
      throw new Error(`Gemini API error: ${msg}`);
    }
    const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().toUpperCase();
    return text.startsWith('YES');
  } catch (err) {
    clearTimeout(t);
    if (err.name === 'AbortError') return false;
    throw err;
  }
}

async function callOpenAIDecide(systemContent, userContent) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_DECIDE_MODEL || 'gpt-4o-mini';

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), DECIDE_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 10,
      }),
      signal: controller.signal,
    });
    clearTimeout(t);
    const data = await res.json();
    // Check for API errors (invalid key, quota, etc.)
    if (!res.ok || data.error) {
      const msg = data.error?.message || `OpenAI API ${res.status}`;
      throw new Error(`OpenAI API error: ${msg}`);
    }
    const text = (data.choices?.[0]?.message?.content || '').trim().toUpperCase();
    return text.startsWith('YES');
  } catch (err) {
    clearTimeout(t);
    if (err.name === 'AbortError') return false;
    throw err;
  }
}

/**
 * Register an agent with the social profile (name, optional age, bio, hobbies, personality_traits).
 * Backend fields (model_provider, protocol, etc.) have defaults so only profile is required for social use.
 */
async function registerAgent(agentProfile) {
  return agentModel.create(agentProfile);
}

/**
 * One agent browses others and decides via LLM whether to connect. Records interest when YES.
 * After each new interest, checks for mutual match and creates session if applicable (no duplicate active session).
 */
async function browseAndDecide(agentId) {
  const agent = await agentModel.findById(agentId);
  if (!agent) {
    const err = new Error('Agent not found');
    err.statusCode = 404;
    throw err;
  }

  // Pre-fetch existing interests, rejections, and active sessions so we skip agents
  // we already decided on or already have a conversation with (saves LLM calls + avoids spam).
  const [alreadyInterestedIn, alreadyRejected, activePartners, allOthers] = await Promise.all([
    interestModel.getInterestsFrom(agentId),
    interestModel.getRejectionsFrom(agentId),
    sessionModel.getActivePartners(agentId),
    agentModel.findAllExcept(agentId, BROWSE_BATCH_SIZE),
  ]);

  // Filter: only browse agents we haven't decided on (YES or NO) and don't have an active session with
  const others = allOthers.filter(
    (o) => !alreadyInterestedIn.has(o.id) && !alreadyRejected.has(o.id) && !activePartners.has(o.id)
  );

  const skipped = allOthers.length - others.length;
  if (others.length === 0) {
    // Nothing new to browse — all agents already handled
    return { interests_recorded: false, sessions_created: 0, sessions: [] };
  }

  const created = [];
  let yesCount = 0;
  let noCount = 0;
  let errCount = 0;
  let limitReached = false;

  for (const other of others) {
    // ── Daily match limit check ────────────────────────────────────────────
    // Each YES decision costs one match credit.
    // Check BEFORE calling the LLM so we don't waste API calls.
    const allowed = await matchPermissionService.canMatch(agentId);
    if (!allowed) {
      limitReached = true;
      console.log(`[socialMatch] ${agent.name} hit daily match limit — stopping browse`);
      break;
    }

    const otherProfile = getProfileForBrowse(other);
    let wantToConnect;
    try {
      wantToConnect = await decideWithLLM(agent, otherProfile);
    } catch (err) {
      errCount++;
      console.warn(`[socialMatch] LLM error for ${agent.name} → ${other.name}: ${err.message}`);
      continue;
    }

    if (!wantToConnect) {
      noCount++;
      // Record the rejection so this agent never sees this profile again
      await interestModel.recordRejection(agentId, other.id);
      continue;
    }

    // ── Consume one match credit on YES ────────────────────────────────────
    try {
      await matchPermissionService.consumeMatch(agentId);
    } catch (limitErr) {
      limitReached = true;
      console.log(`[socialMatch] ${agent.name} match limit consumed mid-browse — stopping`);
      break;
    }

    yesCount++;
    console.log(`[socialMatch] ${agent.name} → YES → ${other.name}`);
    await interestModel.recordInterest(agentId, other.id);

    const mutual = await mutualMatchCheck(agentId, other.id);
    if (mutual) {
      const session = await createSession(agentId, other.id);
      if (session) {
        console.log(`[socialMatch] MUTUAL MATCH! ${agent.name} ↔ ${other.name} → session ${session.id}`);
        viewerQueue.enqueue({
          agent_a: session.agent_a,
          agent_b: session.agent_b,
          session_id: session.id,
          created_at: session.created_at,
        });
        created.push(session);

        // Auto-run the conversation in the background (fire-and-forget).
        // This is the ONLY place sessions should be auto-triggered — not the frontend.
        sessionService.runSession(session.id).catch((runErr) => {
          console.error(`[socialMatch] Failed to auto-run session ${session.id}: ${runErr.message}`);
        });
      }
    }
  }

  console.log(`[socialMatch] ${agent.name} browsed ${others.length} new (${skipped} skipped): ${yesCount} yes, ${noCount} no, ${errCount} errors, ${created.length} sessions${limitReached ? ' [LIMIT HIT]' : ''}`);
  return { interests_recorded: yesCount > 0 || noCount > 0, sessions_created: created.length, sessions: created, limit_reached: limitReached };
}

/**
 * Returns true if both agents have expressed interest in each other and there is no active session between them.
 */
async function mutualMatchCheck(agentA, agentB) {
  const [mutual, activeSession] = await Promise.all([
    interestModel.hasMutualInterest(agentA, agentB),
    sessionModel.findActiveByParticipants(agentA, agentB),
  ]);
  return mutual && !activeSession;
}

/**
 * Create or reuse a session between two agents (atomic; no duplicate active sessions).
 */
async function createSession(agentA, agentB) {
  return sessionService.startSession(agentA, agentB);
}

/**
 * Send a message in a session. Enforces participant and ≤800 characters; personality is applied in executor.
 */
const MAX_MESSAGE_CHARS = 800;

async function sendMessage(agentId, sessionId, content) {
  if (typeof content !== 'string' || !content.trim()) {
    const err = new Error('Message content is required');
    err.statusCode = 400;
    throw err;
  }
  const trimmed = content.trim();
  if (trimmed.length > MAX_MESSAGE_CHARS) {
    const err = new Error(`Message must be at most ${MAX_MESSAGE_CHARS} characters`);
    err.statusCode = 400;
    throw err;
  }
  return sessionService.sendMessage(sessionId, agentId, trimmed);
}

module.exports = {
  getProfileForBrowse,
  registerAgent,
  browseAndDecide,
  mutualMatchCheck,
  createSession,
  sendMessage,
  BROWSE_BATCH_SIZE,
  MAX_MESSAGE_CHARS,
};
