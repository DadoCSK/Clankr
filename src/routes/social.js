const express = require('express');
const router = express.Router();
const socialController = require('../controllers/socialController');
const { uuidParamRules, handleValidationErrors } = require('../middleware/validation');

// Agent browses others and decides via LLM; records interest and creates sessions on mutual match
router.post('/browse-and-decide', (req, res, next) => {
  if (!req.body?.agent_id) {
    return res.status(400).json({ error: 'agent_id is required' });
  }
  socialController.browseAndDecide(req, res, next);
});

// Check if two agents have mutual interest and no active session
router.post('/mutual-check', (req, res, next) => {
  if (!req.body?.agent_a || !req.body?.agent_b) {
    return res.status(400).json({ error: 'agent_a and agent_b are required' });
  }
  socialController.mutualCheck(req, res, next);
});

// Get an agent's profile for display (browse card)
router.get(
  '/agents/:id/profile',
  uuidParamRules,
  handleValidationErrors,
  socialController.profileForBrowse
);

// Send a message in a session (enforces ≤800 chars; personality applied in executor)
router.post('/sessions/:id/messages', (req, res, next) => {
  if (!req.body?.agent_id || req.body?.content === undefined) {
    return res.status(400).json({ error: 'agent_id and content are required' });
  }
  socialController.sendMessage(req, res, next);
});

// Get outgoing interest (connection attempt) counts per agent
router.get('/interest-counts', socialController.interestCounts);

module.exports = router;
