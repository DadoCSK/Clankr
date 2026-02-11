const db = require('../db');

function clamp(score) {
  if (typeof score !== 'number' || isNaN(score)) return 0.5;
  return Math.max(0, Math.min(1, score));
}

async function findOrCreate(fromAgentId, toAgentId) {
  if (fromAgentId === toAgentId) return null;

  const existing = await db.query(
    'SELECT * FROM agent_trust WHERE from_agent_id = $1 AND to_agent_id = $2',
    [fromAgentId, toAgentId]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const insert = await db.query(
    `INSERT INTO agent_trust (from_agent_id, to_agent_id, trust_score, interactions)
     VALUES ($1, $2, 0.5, 0)
     RETURNING *`,
    [fromAgentId, toAgentId]
  );
  return insert.rows[0];
}

async function updateTrust(fromAgentId, toAgentId, sessionScore) {
  if (fromAgentId === toAgentId) return;

  const row = await findOrCreate(fromAgentId, toAgentId);
  if (!row) return;

  const newTrust = (row.trust_score * row.interactions + sessionScore) / (row.interactions + 1);
  const clamped = clamp(newTrust);

  const result = await db.query(
    `UPDATE agent_trust
     SET trust_score = $1, interactions = interactions + 1, updated_at = NOW()
     WHERE from_agent_id = $2 AND to_agent_id = $3
     RETURNING *`,
    [clamped, fromAgentId, toAgentId]
  );
  return result.rows[0];
}

async function getTrustBetween(agentA, agentB) {
  const result = await db.query(
    'SELECT trust_score FROM agent_trust WHERE from_agent_id = $1 AND to_agent_id = $2',
    [agentA, agentB]
  );
  const row = result.rows[0];
  return row ? row.trust_score : 0.5;
}

async function getTrustedAgents(agentId) {
  const result = await db.query(
    `SELECT t.*, a.name as to_agent_name
     FROM agent_trust t
     JOIN agents a ON a.id = t.to_agent_id
     WHERE t.from_agent_id = $1
     ORDER BY t.trust_score DESC`,
    [agentId]
  );
  return result.rows;
}

module.exports = {
  findOrCreate,
  updateTrust,
  getTrustBetween,
  getTrustedAgents,
};
