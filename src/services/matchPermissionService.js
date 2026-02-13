/**
 * MatchPermissionService — daily match limits, premium status, extra matches.
 *
 * Rules:
 *   - Free users: up to FREE_DAILY_LIMIT (10) matches per 24h window.
 *   - Premium (premiumUntil > now): unlimited matches.
 *   - Extra matches (purchased): used after free quota is exhausted; carry over until consumed.
 *   - Daily window resets automatically after 24h.
 *
 * This service contains ZERO blockchain logic — that lives in solanaService.js.
 */

const matchPermissionModel = require('../models/matchPermission');

const FREE_DAILY_LIMIT = parseInt(process.env.FREE_DAILY_MATCH_LIMIT, 10) || 10;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * If the 24h window has expired, reset the counter and slide the window forward.
 * Returns the (possibly refreshed) permission row.
 */
async function resetDailyIfNeeded(perm) {
  const now = new Date();
  if (new Date(perm.daily_match_reset_at) <= now) {
    return matchPermissionModel.resetDaily(perm.agent_id);
  }
  return perm;
}

/**
 * Is this agent currently premium? (premiumUntil exists and is in the future)
 */
function isPremium(perm) {
  if (!perm.premium_until) return false;
  return new Date(perm.premium_until) > new Date();
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Can this agent perform another match right now?
 *
 * Order of checks:
 *   1. Premium → always yes.
 *   2. Extra matches remaining → yes.
 *   3. Daily count < FREE_DAILY_LIMIT → yes.
 *   4. Otherwise → no.
 */
async function canMatch(agentId) {
  let perm = await matchPermissionModel.getOrCreate(agentId);
  perm = await resetDailyIfNeeded(perm);

  if (isPremium(perm)) return true;
  if (perm.extra_matches > 0) return true;
  if (perm.daily_match_count < FREE_DAILY_LIMIT) return true;
  return false;
}

/**
 * Consume one match credit. Call AFTER successfully deciding to match.
 *
 * Consumption priority:
 *   1. Premium → no deduction.
 *   2. Daily count < limit → increment daily count.
 *   3. Extra matches > 0 → decrement extra matches.
 *   4. Limit reached → throw (caller should have called canMatch first).
 */
async function consumeMatch(agentId) {
  let perm = await matchPermissionModel.getOrCreate(agentId);
  perm = await resetDailyIfNeeded(perm);

  // Premium users don't consume anything
  if (isPremium(perm)) return;

  // Free daily quota still available
  if (perm.daily_match_count < FREE_DAILY_LIMIT) {
    await matchPermissionModel.incrementDailyCount(agentId);
    return;
  }

  // Try extra matches
  const consumed = await matchPermissionModel.consumeExtraMatch(agentId);
  if (consumed) return;

  // Should not reach here if canMatch was checked first
  const err = new Error('Daily match limit reached. Purchase more matches or upgrade to premium.');
  err.statusCode = 429;
  throw err;
}

/**
 * Grant premium (unlimited matches) for `durationHours` from now.
 * Extends existing premium if already active.
 */
async function grantPremium(agentId, durationHours) {
  let perm = await matchPermissionModel.getOrCreate(agentId);
  const now = new Date();
  // If already premium, extend from current expiry; otherwise from now
  const base = isPremium(perm) ? new Date(perm.premium_until) : now;
  const until = new Date(base.getTime() + durationHours * 60 * 60 * 1000);
  return matchPermissionModel.setPremiumUntil(agentId, until);
}

/**
 * Add extra match credits (from a purchase).
 */
async function addExtraMatches(agentId, count) {
  await matchPermissionModel.getOrCreate(agentId);
  return matchPermissionModel.addExtraMatches(agentId, count);
}

/**
 * Link a Solana wallet address to an agent.
 */
async function linkWallet(agentId, walletAddress) {
  await matchPermissionModel.getOrCreate(agentId);
  return matchPermissionModel.setWalletAddress(agentId, walletAddress);
}

/**
 * Get current match permission state for an agent (for UI display).
 */
async function getStatus(agentId) {
  let perm = await matchPermissionModel.getOrCreate(agentId);
  perm = await resetDailyIfNeeded(perm);
  const premium = isPremium(perm);
  return {
    agent_id: perm.agent_id,
    wallet_address: perm.wallet_address,
    is_premium: premium,
    premium_until: perm.premium_until,
    daily_match_count: perm.daily_match_count,
    daily_match_limit: FREE_DAILY_LIMIT,
    daily_matches_remaining: premium
      ? Infinity
      : Math.max(0, FREE_DAILY_LIMIT - perm.daily_match_count) + perm.extra_matches,
    extra_matches: perm.extra_matches,
    daily_match_reset_at: perm.daily_match_reset_at,
  };
}

module.exports = {
  FREE_DAILY_LIMIT,
  canMatch,
  consumeMatch,
  grantPremium,
  addExtraMatches,
  linkWallet,
  getStatus,
};
