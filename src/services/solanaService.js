/**
 * Solana payment verification service.
 *
 * Verifies on-chain transactions against the Solana RPC, then delegates
 * to MatchPermissionService for granting matches/premium.
 *
 * Security:
 *   - Amount is verified server-side from on-chain data (never trust the frontend).
 *   - Transaction signatures are stored to prevent replay / double-spend.
 *   - Sender must match the agent's linked wallet address.
 *   - Recipient must match TREASURY_WALLET_PUBLIC_KEY.
 */

const matchPermissionModel = require('../models/matchPermission');
const matchPermissionService = require('./matchPermissionService');

// ── Configuration ────────────────────────────────────────────────────────────

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL;
const TREASURY_WALLET = process.env.TREASURY_WALLET_PUBLIC_KEY;

// Prices in lamports (1 SOL = 1_000_000_000 lamports)
const PLANS = {
  extra_matches: {
    priceLamports: 10_000_000,   // 0.01 SOL
    label: '+20 matches',
    grant: (agentId) => matchPermissionService.addExtraMatches(agentId, 20),
  },
  unlimited_24h: {
    priceLamports: 30_000_000,   // 0.03 SOL
    label: 'Unlimited 24h',
    grant: (agentId) => matchPermissionService.grantPremium(agentId, 24),
  },
};

// Allow a small tolerance for transaction fees (±0.5% or 5000 lamports)
const LAMPORT_TOLERANCE = 5_000;

// ── RPC helpers ──────────────────────────────────────────────────────────────

/**
 * Fetch a confirmed transaction from Solana RPC.
 */
async function fetchTransaction(signature) {
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getTransaction',
    params: [
      signature,
      { encoding: 'jsonParsed', commitment: 'confirmed', maxSupportedTransactionVersion: 0 },
    ],
  };

  const res = await fetch(SOLANA_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Solana RPC error: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Solana RPC error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  return data.result; // null if not found / not confirmed
}

/**
 * Extract the SOL transfer details from a parsed transaction.
 * Returns { sender, recipient, lamports } or null if no matching transfer found.
 */
function extractTransferDetails(tx) {
  if (!tx || !tx.transaction) return null;

  const instructions = tx.transaction.message.instructions || [];

  // Look for a system program transfer instruction (SOL transfer)
  for (const ix of instructions) {
    if (
      ix.program === 'system' &&
      ix.parsed?.type === 'transfer' &&
      ix.parsed?.info
    ) {
      return {
        sender: ix.parsed.info.source,
        recipient: ix.parsed.info.destination,
        lamports: ix.parsed.info.lamports,
      };
    }
  }

  // Also check innerInstructions (e.g. from a program that wraps transfers)
  const inner = tx.meta?.innerInstructions || [];
  for (const group of inner) {
    for (const ix of group.instructions || []) {
      if (
        ix.program === 'system' &&
        ix.parsed?.type === 'transfer' &&
        ix.parsed?.info
      ) {
        return {
          sender: ix.parsed.info.source,
          recipient: ix.parsed.info.destination,
          lamports: ix.parsed.info.lamports,
        };
      }
    }
  }

  return null;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Verify a Solana payment and grant the purchased plan to an agent.
 *
 * @param {string} agentId     - Agent UUID
 * @param {string} signature   - Solana transaction signature
 * @param {string} plan        - 'extra_matches' | 'unlimited_24h'
 * @returns {{ success: boolean, plan: string, message: string }}
 */
async function verifyPayment(agentId, signature, plan) {
  // ── 1. Validate plan ───────────────────────────────────────────────────────
  const planConfig = PLANS[plan];
  if (!planConfig) {
    const err = new Error(`Unknown plan: ${plan}. Must be one of: ${Object.keys(PLANS).join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  if (!SOLANA_RPC_URL) {
    const err = new Error('Server misconfigured: SOLANA_RPC_URL not set');
    err.statusCode = 500;
    throw err;
  }

  if (!TREASURY_WALLET) {
    const err = new Error('Server misconfigured: TREASURY_WALLET_PUBLIC_KEY not set');
    err.statusCode = 500;
    throw err;
  }

  // ── 2. Check for replay ────────────────────────────────────────────────────
  const alreadyProcessed = await matchPermissionModel.isTransactionProcessed(signature);
  if (alreadyProcessed) {
    const err = new Error('Transaction already processed');
    err.statusCode = 409;
    throw err;
  }

  // ── 3. Get agent's linked wallet ───────────────────────────────────────────
  const perm = await matchPermissionModel.getOrCreate(agentId);
  if (!perm.wallet_address) {
    const err = new Error('No wallet linked to this agent. Call link-wallet first.');
    err.statusCode = 400;
    throw err;
  }

  // ── 4. Fetch transaction from Solana RPC ───────────────────────────────────
  const tx = await fetchTransaction(signature);
  if (!tx) {
    const err = new Error('Transaction not found or not yet confirmed on Solana');
    err.statusCode = 404;
    throw err;
  }

  // Check for transaction errors
  if (tx.meta?.err) {
    const err = new Error('Transaction failed on-chain');
    err.statusCode = 400;
    throw err;
  }

  // ── 5. Extract and verify transfer details ─────────────────────────────────
  const transfer = extractTransferDetails(tx);
  if (!transfer) {
    const err = new Error('No SOL transfer found in transaction');
    err.statusCode = 400;
    throw err;
  }

  // Verify sender matches agent's wallet
  if (transfer.sender !== perm.wallet_address) {
    const err = new Error('Transaction sender does not match agent wallet');
    err.statusCode = 403;
    throw err;
  }

  // Verify recipient matches treasury
  if (transfer.recipient !== TREASURY_WALLET) {
    const err = new Error('Transaction recipient does not match treasury wallet');
    err.statusCode = 400;
    throw err;
  }

  // Verify amount (with small tolerance for rounding)
  const diff = Math.abs(transfer.lamports - planConfig.priceLamports);
  if (diff > LAMPORT_TOLERANCE) {
    const err = new Error(
      `Amount mismatch: expected ${planConfig.priceLamports} lamports, got ${transfer.lamports}`
    );
    err.statusCode = 400;
    throw err;
  }

  // ── 6. Record transaction (prevents replay) ───────────────────────────────
  await matchPermissionModel.recordTransaction(signature, agentId, plan, transfer.lamports);

  // ── 7. Grant the plan ──────────────────────────────────────────────────────
  await planConfig.grant(agentId);

  console.log(`[solana] Payment verified: agent=${agentId} plan=${plan} sig=${signature.slice(0, 16)}...`);

  return {
    success: true,
    plan,
    message: `${planConfig.label} granted successfully`,
  };
}

/**
 * Return plan pricing for the frontend.
 */
function getPricing() {
  return {
    treasury_wallet: TREASURY_WALLET || null,
    plans: Object.entries(PLANS).map(([key, val]) => ({
      id: key,
      label: val.label,
      price_lamports: val.priceLamports,
      price_sol: val.priceLamports / 1_000_000_000,
    })),
  };
}

module.exports = {
  verifyPayment,
  getPricing,
  PLANS,
};
