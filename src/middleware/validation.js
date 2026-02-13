const { body, param, validationResult } = require('express-validator');
const { sanitizeText, sanitizeArray } = require('../utils/sanitize');

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

// ── Array helpers (parse + sanitize items) ───────────────────────────────────

const sanitizeJsonArray = (value) => {
  if (Array.isArray(value)) return sanitizeArray(value);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? sanitizeArray(parsed) : [];
    } catch {
      return [];
    }
  }
  return [];
};

// Sanitizer: parse + clean array items (used with .customSanitizer)
const sanitizeHobbies = (value) => sanitizeJsonArray(value);
const sanitizeTraits = (value) => sanitizeJsonArray(value);

// Validator: check array length + item length (used with .custom after sanitizer)
const validateHobbies = (value) => {
  const arr = Array.isArray(value) ? value : [];
  if (arr.length < 2 || arr.length > 10) {
    throw new Error('hobbies must be an array of 2–10 words or phrases');
  }
  for (const item of arr) {
    if (typeof item === 'string' && item.length > 100) throw new Error('Each hobby must be at most 100 characters');
  }
  return true;
};

const validateTraits = (value) => {
  const arr = Array.isArray(value) ? value : [];
  if (arr.length < 2 || arr.length > 5) {
    throw new Error('personality_traits must be an array of 2–5 words or phrases');
  }
  for (const item of arr) {
    if (typeof item === 'string' && item.length > 100) throw new Error('Each personality trait must be at most 100 characters');
  }
  return true;
};

// ── Custom sanitizer for express-validator chain ─────────────────────────────

const stripDangerous = (value) => {
  if (typeof value !== 'string') return value;
  return sanitizeText(value);
};

// ── Registration rules ───────────────────────────────────────────────────────

const agentRegistrationRules = [
  body('name').trim().customSanitizer(stripDangerous).notEmpty().withMessage('name is required').isLength({ max: 255 }),
  body('description').optional().trim().customSanitizer(stripDangerous).isLength({ max: 2000 }),
  body('age').optional().isInt({ min: 0, max: 150 }).withMessage('age must be 0-150'),
  body('bio').trim().customSanitizer(stripDangerous).notEmpty().withMessage('bio is required (1–2 sentences)').isLength({ min: 1, max: 1000 }),
  body('hobbies').customSanitizer(sanitizeHobbies).custom(validateHobbies),
  body('personality_traits').customSanitizer(sanitizeTraits).custom(validateTraits),
  body('model_provider').optional().trim().customSanitizer(stripDangerous).isLength({ max: 255 }),
  body('model_name').optional().trim().customSanitizer(stripDangerous).isLength({ max: 255 }),
  body('temperature').optional().isFloat({ min: 0, max: 2 }).withMessage('temperature must be between 0 and 2'),
  body('capabilities').optional().customSanitizer(sanitizeJsonArray),
  body('goals').optional().customSanitizer(sanitizeJsonArray),
  body('protocol').trim().customSanitizer(stripDangerous).notEmpty().withMessage('protocol is required').isLength({ max: 255 }),
  body('response_format').trim().customSanitizer(stripDangerous).notEmpty().withMessage('response_format is required').isLength({ max: 255 }),
  body('session_types').optional().customSanitizer(sanitizeJsonArray),
  body('max_session_length').optional().isInt({ min: 1, max: 1000 }),
  body('can_access_external_tools').optional().isBoolean(),
  body('risk_level').optional().trim().customSanitizer(stripDangerous).isLength({ max: 50 }),
  body('agent_type').optional().trim().isIn(['internal', 'external']),
  // Webhook URL: HTTPS required in production; HTTP allowed in dev for local testing
  body('webhook_url').optional().trim()
    .isURL({
      require_tld: process.env.NODE_ENV === 'production',
      require_protocol: true,
      protocols: process.env.NODE_ENV === 'production' ? ['https'] : ['http', 'https'],
    })
    .isLength({ max: 2048 })
    .withMessage('webhook_url must be a valid URL (HTTPS required in production)'),
  body().custom((value, { req }) => {
    if (req.body.agent_type === 'external') {
      const url = req.body.webhook_url?.trim();
      if (!url) throw new Error('webhook_url is required for external agents');
      // Block SSRF targets in production
      if (process.env.NODE_ENV === 'production') {
        const lowerUrl = url.toLowerCase();
        const ssrfPatterns = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.', '10.', '192.168.', '[::1'];
        for (const pat of ssrfPatterns) {
          if (lowerUrl.includes(pat)) {
            throw new Error('webhook_url must not point to internal/private addresses');
          }
        }
      }
    }
    return true;
  }),
];

// ── Other rules ──────────────────────────────────────────────────────────────

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
  body('content').trim().customSanitizer(stripDangerous).notEmpty().withMessage('content is required')
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
