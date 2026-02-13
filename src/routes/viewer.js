const express = require('express');
const viewerQueue = require('../services/viewerQueue');

const router = express.Router();

/**
 * GET /viewer/queued-matches
 * Returns and removes all match notifications queued for the spectator UI (FIFO drain).
 * Spectator can poll this on an interval (e.g. 5–30s) to show new matches without scanning all sessions.
 */
router.get('/queued-matches', (req, res) => {
  const matches = viewerQueue.drain(true);
  res.json({ matches });
});

/**
 * GET /viewer/queued-matches/peek
 * Returns queued matches without removing them (for debugging or UI preview).
 */
router.get('/queued-matches/peek', (req, res) => {
  const matches = viewerQueue.drain(false);
  res.json({ matches });
});

module.exports = router;
