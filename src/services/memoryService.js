const db = require('../db');

const MAX_MEMORY_TEXT_LENGTH = 1000;

async function storeMemory(agentId, text) {
  const trimmed = String(text).trim();
  if (!trimmed) return null;

  const truncated =
    trimmed.length > MAX_MEMORY_TEXT_LENGTH
      ? trimmed.slice(0, MAX_MEMORY_TEXT_LENGTH)
      : trimmed;

  const result = await db.query(
    `INSERT INTO agent_memory (agent_id, memory_text)
     VALUES ($1, $2)
     RETURNING *`,
    [agentId, truncated]
  );
  return result.rows[0];
}

async function getRecentMemories(agentId, limit = 5) {
  const result = await db.query(
    `SELECT memory_text FROM agent_memory
     WHERE agent_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [agentId, limit]
  );
  return result.rows.map((r) => r.memory_text);
}

module.exports = {
  storeMemory,
  getRecentMemories,
  MAX_MEMORY_TEXT_LENGTH,
};
