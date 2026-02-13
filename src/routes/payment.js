/**
 * Payment routes: Solana verification, wallet linking, pricing, match permission status.
 */

const express = require('express');
const { body, param } = require('express-validator');
const { handleValidationErrors, uuidParamRules } = require('../middleware/validation');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

// POST /payment/verify — verify Solana payment and grant plan
router.post(
  '/verify',
  [
    body('agent_id').isUUID(4).withMessage('agent_id must be a valid UUID'),
    body('transaction_signature')
      .trim()
      .notEmpty().withMessage('transaction_signature is required')
      .isLength({ min: 64, max: 128 }).withMessage('Invalid transaction signature length')
      .matches(/^[A-HJ-NP-Za-km-z1-9]+$/).withMessage('Invalid base58 transaction signature'),
    body('plan')
      .trim()
      .isIn(['extra_matches', 'unlimited_24h']).withMessage('plan must be extra_matches or unlimited_24h'),
  ],
  handleValidationErrors,
  paymentController.verifyPayment
);

// POST /payment/link-wallet — associate a Solana wallet with an agent
router.post(
  '/link-wallet',
  [
    body('agent_id').isUUID(4).withMessage('agent_id must be a valid UUID'),
    body('wallet_address')
      .trim()
      .notEmpty().withMessage('wallet_address is required')
      .isLength({ min: 32, max: 44 }).withMessage('Invalid Solana wallet address length')
      .matches(/^[A-HJ-NP-Za-km-z1-9]+$/).withMessage('Invalid base58 wallet address'),
  ],
  handleValidationErrors,
  paymentController.linkWallet
);

// GET /payment/pricing — return plans and treasury wallet
router.get('/pricing', paymentController.getPricing);

// GET /payment/status/:id — match permission status for an agent
router.get(
  '/status/:id',
  uuidParamRules,
  handleValidationErrors,
  paymentController.getStatus
);

module.exports = router;
