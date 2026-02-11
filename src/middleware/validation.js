const { body, param, validationResult } = require('express-validator');

const MAX_MESSAGE_LENGTH = parseInt(process.env.MAX_MESSAGE_LENGTH, 10) || 10000;

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

const sanitizeJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const agentRegistrationRules = [
  body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 255 }),
  body('description').optional().trim(),
  body('model_provider').optional().trim().isLength({ max: 255 }),
  body('model_name').optional().trim().isLength({ max: 255 }),
  body('temperature').optional().isFloat({ min: 0, max: 2 }).withMessage('temperature must be between 0 and 2'),
  body('capabilities').optional().custom(sanitizeJsonArray),
  body('goals').optional().custom(sanitizeJsonArray),
  body('protocol').trim().notEmpty().withMessage('protocol is required').isLength({ max: 255 }),
  body('response_format').trim().notEmpty().withMessage('response_format is required').isLength({ max: 255 }),
  body('session_types').optional().custom(sanitizeJsonArray),
  body('max_session_length').optional().isInt({ min: 1, max: 1000 }),
  body('can_access_external_tools').optional().isBoolean(),
  body('risk_level').optional().trim().isLength({ max: 50 }),
  body('agent_type').optional().trim().isIn(['internal', 'external']),
  body('webhook_url').optional().trim().isURL({ require_tld: false }).isLength({ max: 2048 }),
  body().custom((value, { req }) => {
    if (req.body.agent_type === 'external') {
      const url = req.body.webhook_url?.trim();
      if (!url) throw new Error('webhook_url is required for external agents');
    }
    return true;
  }),
];

const matchRules = [
  body('agent_id').isUUID(4).withMessage('agent_id must be a valid UUID'),
];

const sessionStartRules = [
  body('agent_a').isUUID(4).withMessage('agent_a must be a valid UUID'),
  body('agent_b').isUUID(4).withMessage('agent_b must be a valid UUID'),
  body().custom((value, { req }) => {
    if (req.body.agent_a === req.body.agent_b) {
      throw new Error('agent_a and agent_b must be different');
    }
    return true;
  }),
];

const uuidParamRules = [
  param('id').isUUID(4).withMessage('Invalid UUID'),
];

const messageRules = [
  body('sender_agent_id').isUUID(4).withMessage('sender_agent_id must be a valid UUID'),
  body('content').trim().notEmpty().withMessage('content is required')
    .isLength({ max: MAX_MESSAGE_LENGTH })
    .withMessage(`content must not exceed ${MAX_MESSAGE_LENGTH} characters`),
];

module.exports = {
  handleValidationErrors,
  agentRegistrationRules,
  matchRules,
  sessionStartRules,
  messageRules,
  uuidParamRules,
  MAX_MESSAGE_LENGTH,
};
