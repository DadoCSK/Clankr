const db = require('../db');

/**
 * Record that fromAgentId has expressed interest in toAgentId (idempotent: one row per direction).
 */
async function recordInterest(fromAgentId, toAgentId) {
  const result = await db.query(
    `INSERT INTO agent_interest (from_agent_id, to_agent_id)
     VALUES ($1, $2)
     ON CONFLICT (from_agent_id, to_agent_id) DO NOTHING
     RETURNING *`,
    [fromAgentId, toAgentId]
  );
  return result.rows[0] || null;
}

/**
 * Returns true if fromAgentId has expressed interest in toAgentId.
 */
async function hasInterest(fromAgentId, toAgentId) {
  const result = await db.query(
    'SELECT 1 FROM agent_interest WHERE from_agent_id = $1 AND to_agent_id = $2',
    [fromAgentId, toAgentId]
  );
  return result.rows.length > 0;
}

/**
 * Check mutual interest: both A→B and B→A exist.
 */
async function hasMutualInterest(agentA, agentB) {
  const [aToB, bToA] = await Promise.all([
    hasInterest(agentA, agentB),
    hasInterest(agentB, agentA),
  ]);
  return aToB && bToA;
}

/**
 * Get all agent IDs that fromAgentId has already expressed interest in.
 * Returns a Set for O(1) lookup.
 */
async function getInterestsFrom(fromAgentId) {
  const result = await db.query(
    'SELECT to_agent_id FROM agent_interest WHERE from_agent_id = $1',
    [fromAgentId]
  );
  return new Set(result.rows.map((r) => r.to_agent_id));
}

/**
 * Count outgoing interests (connection attempts) per agent.
 * Returns an array of { agent_id, count } for all agents that have expressed interest.
 */
async function getInterestCounts() {
  const result = await db.query(
    `SELECT from_agent_id AS agent_id, COUNT(*)::int AS count
     FROM agent_interest
     GROUP BY from_agent_id`
  );
  return result.rows;
}

// ── Rejections (NO decisions) ────────────────────────────────────────────────

/**
 * Record that fromAgentId rejected toAgentId (idempotent).
 */
async function recordRejection(fromAgentId, toAgentId) {
  const result = await db.query(
    `INSERT INTO agent_rejection (from_agent_id, to_agent_id)
     VALUES ($1, $2)
     ON CONFLICT (from_agent_id, to_agent_id) DO NOTHING
     RETURNING *`,
    [fromAgentId, toAgentId]
  );
  return result.rows[0] || null;
}

/**
 * Get all agent IDs that fromAgentId has rejected.
 * Returns a Set for O(1) lookup.
 */
async function getRejectionsFrom(fromAgentId) {
  const result = await db.query(
    'SELECT to_agent_id FROM agent_rejection WHERE from_agent_id = $1',
    [fromAgentId]
  );
  return new Set(result.rows.map((r) => r.to_agent_id));
}

module.exports = {
  recordInterest,
  hasInterest,
  hasMutualInterest,
  getInterestsFrom,
  getInterestCounts,
  recordRejection,
  getRejectionsFrom,
};
