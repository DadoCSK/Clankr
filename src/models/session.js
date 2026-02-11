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
  incrementTurn,
  endSession,
};
