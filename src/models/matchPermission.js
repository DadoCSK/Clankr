/**
 * Data-access layer for match_permissions and processed_transactions tables.
 * Keeps all SQL in one place — services call these functions, never raw queries.
 */

const db = require('../db');

// ── match_permissions ────────────────────────────────────────────────────────

/**
 * Get or lazily create a match_permissions row for an agent.
 * Ensures every agent has a row the first time we check permissions.
 */
async function getOrCreate(agentId) {
  // Upsert: insert if missing, return existing if present
  const result = await db.query(
    `INSERT INTO match_permissions (agent_id)
     VALUES ($1)
     ON CONFLICT (agent_id) DO NOTHING
     RETURNING *`,
    [agentId]
  );
  if (result.rows[0]) return result.rows[0];
  // Row already existed — fetch it
  return findByAgentId(agentId);
}

async function findByAgentId(agentId) {
  const result = await db.query(
    'SELECT * FROM match_permissions WHERE agent_id = $1',
    [agentId]
  );
  return result.rows[0] || null;
}

/**
 * Reset daily_match_count to 0 and push reset window +24h.
 */
async function resetDaily(agentId) {
  const result = await db.query(
    `UPDATE match_permissions
     SET daily_match_count = 0,
         daily_match_reset_at = NOW() + INTERVAL '24 hours'
     WHERE agent_id = $1
     RETURNING *`,
    [agentId]
  );
  return result.rows[0];
}

/**
 * Increment daily_match_count by 1 (free-tier consumption).
 */
async function incrementDailyCount(agentId) {
  const result = await db.query(
    `UPDATE match_permissions
     SET daily_match_count = daily_match_count + 1
     WHERE agent_id = $1
     RETURNING *`,
    [agentId]
  );
  return result.rows[0];
}

/**
 * Consume one extra match (purchased bonus). Decrements extra_matches by 1.
 */
async function consumeExtraMatch(agentId) {
  const result = await db.query(
    `UPDATE match_permissions
     SET extra_matches = extra_matches - 1
     WHERE agent_id = $1 AND extra_matches > 0
     RETURNING *`,
    [agentId]
  );
  return result.rows[0] || null;
}

/**
 * Add N extra matches (from a purchase).
 */
async function addExtraMatches(agentId, count) {
  const result = await db.query(
    `UPDATE match_permissions
     SET extra_matches = extra_matches + $2
     WHERE agent_id = $1
     RETURNING *`,
    [agentId, count]
  );
  return result.rows[0];
}

/**
 * Grant premium (unlimited matches) until a specific timestamp.
 */
async function setPremiumUntil(agentId, until) {
  const result = await db.query(
    `UPDATE match_permissions
     SET premium_until = $2
     WHERE agent_id = $1
     RETURNING *`,
    [agentId, until]
  );
  return result.rows[0];
}

/**
 * Link a Solana wallet address to an agent.
 */
async function setWalletAddress(agentId, walletAddress) {
  const result = await db.query(
    `UPDATE match_permissions
     SET wallet_address = $2
     WHERE agent_id = $1
     RETURNING *`,
    [agentId, walletAddress]
  );
  return result.rows[0];
}

// ── processed_transactions ───────────────────────────────────────────────────

/**
 * Check if a Solana transaction signature has already been processed.
 */
async function isTransactionProcessed(signature) {
  const result = await db.query(
    'SELECT 1 FROM processed_transactions WHERE signature = $1',
    [signature]
  );
  return result.rows.length > 0;
}

/**
 * Record a processed transaction (prevents replay).
 */
async function recordTransaction(signature, agentId, plan, amountLamports) {
  await db.query(
    `INSERT INTO processed_transactions (signature, agent_id, plan, amount_lamports)
     VALUES ($1, $2, $3, $4)`,
    [signature, agentId, plan, amountLamports]
  );
}

module.exports = {
  getOrCreate,
  findByAgentId,
  resetDaily,
  incrementDailyCount,
  consumeExtraMatch,
  addExtraMatches,
  setPremiumUntil,
  setWalletAddress,
  isTransactionProcessed,
  recordTransaction,
};
