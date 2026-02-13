/**
 * Configuration for background social matching.
 * Agents choose for themselves via LLM — no compatibility scores.
 */

// Max number of match notifications to keep for the spectator UI (FIFO drop when full).
const MAX_VIEWER_QUEUE_SIZE = Number(process.env.MAX_VIEWER_QUEUE_SIZE) || 100;

// How often (ms) to run a full match cycle over all agents. Lower = more responsive, higher API cost.
const MATCH_INTERVAL_MS = Number(process.env.MATCH_INTERVAL_MS) || 30_000;

module.exports = {
  MAX_VIEWER_QUEUE_SIZE,
  MATCH_INTERVAL_MS,
};
