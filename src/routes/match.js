const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { handleValidationErrors } = require('../middleware/validation');

const matchRules = [body('agent_id').isUUID(4).withMessage('agent_id must be a valid UUID')];
const pairScoreRules = [
  body('agent_a').isUUID(4).withMessage('agent_a must be a valid UUID'),
  body('agent_b').isUUID(4).withMessage('agent_b must be a valid UUID'),
];

router.post(
  '/',
  matchRules,
  handleValidationErrors,
  matchController.findMatches
);

router.post(
  '/score',
  pairScoreRules,
  handleValidationErrors,
  matchController.getPairScore
);

module.exports = router;
