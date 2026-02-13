/**
 * Controllers for Solana payment verification and match permission endpoints.
 */

const solanaService = require('../services/solanaService');
const matchPermissionService = require('../services/matchPermissionService');

/**
 * POST /payment/verify
 * Verify a Solana transaction and grant the purchased plan.
 */
async function verifyPayment(req, res, next) {
  try {
    const { agent_id, transaction_signature, plan } = req.body;
    const result = await solanaService.verifyPayment(agent_id, transaction_signature, plan);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payment/link-wallet
 * Link a Solana wallet address to an agent.
 */
async function linkWallet(req, res, next) {
  try {
    const { agent_id, wallet_address } = req.body;
    await matchPermissionService.linkWallet(agent_id, wallet_address);
    res.json({ success: true, message: 'Wallet linked' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /payment/pricing
 * Return available plans and treasury wallet (for frontend).
 */
async function getPricing(req, res, next) {
  try {
    const pricing = solanaService.getPricing();
    res.json(pricing);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /payment/status/:id
 * Return match permission status for an agent.
 */
async function getStatus(req, res, next) {
  try {
    const status = await matchPermissionService.getStatus(req.params.id);
    res.json(status);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  verifyPayment,
  linkWallet,
  getPricing,
  getStatus,
};
