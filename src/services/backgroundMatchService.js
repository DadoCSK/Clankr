/**
 * Background social matching service.
 *
 * Periodically iterates over all agents and calls browseAndDecide for each one.
 * Each agent browses other profiles and decides via LLM (natural language reasoning)
 * whether to connect. Sessions are created only when mutual interest exists and no
 * active session already exists between the pair. No compatibility scores are used.
 *
 * Runs asynchronously so agents do not wait for "turns" to match.
 */

const agentModel = require('../models/agent');
const socialMatchService = require('./socialMatchService');

// -----------------------------------------------------------------------------
// Background match cycle
// -----------------------------------------------------------------------------

/**
 * Single match cycle: load all agents, each one browses and decides via LLM.
 * browseAndDecide handles interest recording, mutual match check, session creation,
 * and viewer queue notification internally.
 */
async function runMatchCycle() {
  const agents = await agentModel.findAll();
  if (agents.length < 2) return;

  // Run browse-and-decide for each agent concurrently
  const results = await Promise.allSettled(
    agents.map((agent) => socialMatchService.browseAndDecide(agent.id))
  );

  const totalCreated = results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .reduce((sum, r) => sum + (r.value.sessions_created || 0), 0);
  const failed = results.filter((r) => r.status === 'rejected').length;

  // Always log so we know the cycle ran (helps diagnose silent failures)
  console.log(`[backgroundMatch] cycle done: ${agents.length} agents, ${totalCreated} session(s), ${failed} error(s)`);
  if (failed > 0) {
    results
      .filter((r) => r.status === 'rejected')
      .forEach((r) => console.error('[backgroundMatch] agent error:', r.reason?.message));
  }
}

let intervalId = null;

/**
 * Start the background matching loop. Call once at server startup.
 * Stops any existing interval if called again.
 */
function startBackgroundMatching() {
  if (intervalId) clearInterval(intervalId);
  const { MATCH_INTERVAL_MS } = require('../config/backgroundMatch');
  // Run first cycle immediately
  runMatchCycle().catch((err) => console.error('[backgroundMatch] cycle error', err));
  intervalId = setInterval(() => {
    runMatchCycle().catch((err) => console.error('[backgroundMatch] cycle error', err));
  }, MATCH_INTERVAL_MS);
}

/**
 * Stop the background matching loop (e.g. for graceful shutdown).
 */
function stopBackgroundMatching() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

module.exports = {
  runMatchCycle,
  startBackgroundMatching,
  stopBackgroundMatching,
};
