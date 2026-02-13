/**
 * In-memory queue of newly matched pairs for the spectator UI.
 * Match notifications are added by the background matcher and consumed via GET /viewer/queued-matches.
 * Bounded by MAX_VIEWER_QUEUE_SIZE (FIFO drop when full).
 */

const { MAX_VIEWER_QUEUE_SIZE } = require('../config/backgroundMatch');

let queue = [];

/**
 * Add a match notification for the viewer. Each entry is { agent_a, agent_b, session_id?, created_at }.
 * If queue is at capacity, oldest entry is dropped (FIFO).
 */
function enqueue(entry) {
  const item = {
    agent_a: entry.agent_a,
    agent_b: entry.agent_b,
    session_id: entry.session_id ?? null,
    created_at: entry.created_at ?? new Date().toISOString(),
  };
  queue.push(item);
  if (queue.length > MAX_VIEWER_QUEUE_SIZE) {
    queue = queue.slice(-MAX_VIEWER_QUEUE_SIZE);
  }
}

/**
 * Drain and return all queued matches (for spectator poll). Optional: only return, do not remove (peek).
 */
function drain(remove = true) {
  const out = [...queue];
  if (remove) queue = [];
  return out;
}

/**
 * Return current queue length (for monitoring).
 */
function size() {
  return queue.length;
}

module.exports = {
  enqueue,
  drain,
  size,
};
