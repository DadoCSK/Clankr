const db = require('../db');

async function create(agentA, agentB, maxTurns = 50) {
  const result = await db.query(
    `INSERT INTO sessions (agent_a, agent_b, max_turns, current_turn, status)
     VALUES ($1, $2, $3, 0, 'active')
     RETURNING *`,
    [agentA, agentB, maxTurns]
  );
  return result.rows[0];
}

/**
 * Find an active session between two participants (order-independent).
 * Used to avoid creating duplicate sessions when mutual match triggers again.
 * Reusable for 2-agent sessions; can be extended for multi-agent by passing array and matching.
 *
 * Sample query (2 agents):
 *   SELECT * FROM sessions
 *   WHERE status = 'active'
 *   AND ((agent_a = $1 AND agent_b = $2) OR (agent_a = $2 AND agent_b = $1))
 *   LIMIT 1
 */
async function findActiveByParticipants(agentA, agentB) {
  const result = await db.query(
    `SELECT * FROM sessions
     WHERE status = 'active'
     AND ((agent_a = $1 AND agent_b = $2) OR (agent_a = $2 AND agent_b = $1))
     ORDER BY created_at DESC
     LIMIT 1`,
    [agentA, agentB]
  );
  return result.rows[0] || null;
}

/**
 * Get all agent IDs that have an active session with the given agent.
 * Returns a Set for O(1) lookup.
 */
async function getActivePartners(agentId) {
  const result = await db.query(
    `SELECT CASE WHEN agent_a = $1 THEN agent_b ELSE agent_a END AS partner_id
     FROM sessions
     WHERE status = 'active'
     AND (agent_a = $1 OR agent_b = $1)`,
    [agentId]
  );
  return new Set(result.rows.map((r) => r.partner_id));
}

async function findById(id) {
  const result = await db.query(
    'SELECT * FROM sessions WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function findAll() {
  const result = await db.query(
    'SELECT * FROM sessions ORDER BY created_at DESC'
  );
  return result.rows;
}

async function incrementTurn(sessionId) {
  const result = await db.query(
    `UPDATE sessions
     SET current_turn = current_turn + 1
     WHERE id = $1
     RETURNING *`,
    [sessionId]
  );
  return result.rows[0];
}

async function endSession(sessionId) {
  const result = await db.query(
    `UPDATE sessions SET status = 'ended' WHERE id = $1 RETURNING *`,
    [sessionId]
  );
  return result.rows[0];
}

module.exports = {
  create,
  findById,
  findAll,
  findActiveByParticipants,
  getActivePartners,
  incrementTurn,
  endSession,
};
