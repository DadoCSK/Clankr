/**
 * DEPRECATED — compatibility scores are no longer used for matching.
 * Matching is now agent-driven via socialMatchService (browse-and-decide with LLM).
 *
 * This file is kept for backward compatibility only (legacy /match and /match/score routes).
 * These endpoints may be removed in a future release.
 */

const agentModel = require('../models/agent');
const trustModel = require('../models/trust');

function clamp(score) {
  if (typeof score !== 'number' || isNaN(score)) return 0;
  return Math.max(0, Math.min(1, score));
}

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

function computeCompatibilityScore(agentA, agentB, trustScore) {
  const goalsA = ensureArray(agentA?.goals);
  const goalsB = ensureArray(agentB?.goals);
  const capsA = ensureArray(agentA?.capabilities);
  const capsB = ensureArray(agentB?.capabilities);

  const sharedGoals = goalsA.filter((g) =>
    goalsB.some((gb) => String(gb).toLowerCase() === String(g).toLowerCase())
  );
  const sharedCapabilities = capsA.filter((c) =>
    capsB.some((cb) => String(cb).toLowerCase() === String(c).toLowerCase())
  );

  const repB = clamp(agentB.reputation_score ?? 0.5);
  const trust = clamp(trustScore ?? 0.5);

  return (
    sharedGoals.length * 2 +
    sharedCapabilities.length +
    repB * 2 +
    trust * 3
  );
}

/** @deprecated Use POST /social/browse-and-decide instead */
async function findMatches(agentId) {
  const requestingAgent = await agentModel.findById(agentId);
  if (!requestingAgent) {
    const error = new Error('Agent not found');
    error.statusCode = 404;
    throw error;
  }

  const others = await agentModel.findAllExcept(agentId);
  const scored = await Promise.all(
    others.map(async (agent) => {
      const trustScore = await trustModel.getTrustBetween(agentId, agent.id);
      const score = computeCompatibilityScore(requestingAgent, agent, trustScore);
      return { agent, score };
    })
  );

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).map(({ agent, score }) => ({ ...agent, compatibility_score: score }));
}

/** @deprecated Use POST /social/mutual-check instead */
async function getPairScore(agentAId, agentBId) {
  const [agentA, agentB] = await Promise.all([
    agentModel.findById(agentAId),
    agentModel.findById(agentBId),
  ]);
  if (!agentA || !agentB) {
    const error = new Error('Agent not found');
    error.statusCode = 404;
    throw error;
  }
  const trustScore = await trustModel.getTrustBetween(agentAId, agentBId);
  const score = computeCompatibilityScore(agentA, agentB, trustScore);
  return { compatibility_score: score };
}

module.exports = {
  findMatches,
  getPairScore,
};
