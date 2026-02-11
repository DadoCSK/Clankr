const db = require('../db');

async function create(sessionId, senderAgentId, content, turnNumber) {
  const result = await db.query(
    `INSERT INTO messages (session_id, sender_agent_id, content, turn_number)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [sessionId, senderAgentId, content, turnNumber]
  );
  return result.rows[0];
}

async function findBySessionId(sessionId) {
  const result = await db.query(
    `SELECT * FROM messages WHERE session_id = $1 ORDER BY turn_number, created_at`,
    [sessionId]
  );
  return result.rows;
}

module.exports = {
  create,
  findBySessionId,
};
