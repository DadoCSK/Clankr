'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getPricing,
  linkWallet,
  verifyPayment,
  getMatchPermissionStatus,
  type PricingInfo,
  type PricingPlan,
  type MatchPermissionStatus,
} from '@/lib/api';

// ── Phantom wallet types (injected by the Phantom browser extension) ─────────
interface PhantomProvider {
  isPhantom?: boolean;
  publicKey: { toString(): string } | null;
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  signTransaction(tx: unknown): Promise<unknown>;
  on(event: string, cb: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

// ── Props ────────────────────────────────────────────────────────────────────
interface WalletPaymentProps {
  agentId: string;
  agentName: string;
  onPurchaseComplete?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const SOL_DECIMALS = 1_000_000_000;

function lamportsToSol(lamports: number): string {
  return (lamports / SOL_DECIMALS).toFixed(4);
}

function formatTimeRemaining(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function WalletPayment({ agentId, agentName, onPurchaseComplete }: WalletPaymentProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [status, setStatus] = useState<MatchPermissionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState<string | null>(null); // plan id being purchased
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Load pricing and status ────────────────────────────────────────────────
  const refreshStatus = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([
        getPricing(),
        getMatchPermissionStatus(agentId),
      ]);
      setPricing(p);
      setStatus(s);
      if (s.wallet_address) setWalletAddress(s.wallet_address);
    } catch {
      // pricing endpoint may not be available yet
    }
  }, [agentId]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // ── Connect Phantom wallet ─────────────────────────────────────────────────
  const connectWallet = async () => {
    setError(null);
    setSuccess(null);

    const provider = window.solana;
    if (!provider?.isPhantom) {
      setError('Phantom wallet not found. Please install the Phantom browser extension.');
      return;
    }

    try {
      setLoading(true);
      const resp = await provider.connect();
      const address = resp.publicKey.toString();
      setWalletAddress(address);

      // Link wallet to agent on backend
      await linkWallet(agentId, address);
      await refreshStatus();
      setSuccess('Wallet connected!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  // ── Disconnect wallet ──────────────────────────────────────────────────────
  const disconnectWallet = async () => {
    const provider = window.solana;
    if (provider) {
      try { await provider.disconnect(); } catch { /* ignore */ }
    }
    setWalletAddress(null);
    setSuccess(null);
    setError(null);
  };

  // ── Send SOL and verify ────────────────────────────────────────────────────
  const purchasePlan = async (plan: PricingPlan) => {
    setError(null);
    setSuccess(null);

    if (!walletAddress || !pricing?.treasury_wallet) {
      setError('Connect your wallet first');
      return;
    }

    const provider = window.solana;
    if (!provider?.isPhantom) {
      setError('Phantom wallet not found');
      return;
    }

    try {
      setTxLoading(plan.id);

      // Dynamically import @solana/web3.js (tree-shake friendly)
      const { Connection, PublicKey, Transaction, SystemProgram } = await import('@solana/web3.js');

      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
      if (!rpcUrl) {
        throw new Error('Solana RPC URL not configured. Set NEXT_PUBLIC_SOLANA_RPC_URL.');
      }
      const connection = new Connection(rpcUrl, 'confirmed');

      const fromPubkey = new PublicKey(walletAddress);
      const toPubkey = new PublicKey(pricing.treasury_wallet);

      // Build the transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: plan.price_lamports,
        })
      );

      transaction.feePayer = fromPubkey;
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;

      // Sign with Phantom
      const signed = await provider.signTransaction(transaction);

      // Send the raw transaction
      const serialized = (signed as { serialize(): Buffer }).serialize();
      const signature = await connection.sendRawTransaction(serialized, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      // Verify on backend
      const result = await verifyPayment(agentId, signature, plan.id);
      setSuccess(result.message);
      await refreshStatus();
      onPurchaseComplete?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed';
      setError(msg);
    } finally {
      setTxLoading(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="card p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Match Credits</h3>
          <p className="text-sm text-[var(--text-tertiary)]">for {agentName}</p>
        </div>
        {status && (
          <div className="text-right">
            {status.is_premium ? (
              <span className="badge badge-purple">
                Premium — {formatTimeRemaining(status.premium_until!)}
              </span>
            ) : (
              <span className="text-sm text-[var(--text-secondary)]">
                {status.daily_matches_remaining === Infinity
                  ? 'Unlimited'
                  : `${status.daily_matches_remaining} matches left`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      {status && !status.is_premium && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
            <span>Daily: {status.daily_match_count}/{status.daily_match_limit}</span>
            {status.extra_matches > 0 && (
              <span className="text-[var(--brand-pink)]">+{status.extra_matches} bonus</span>
            )}
          </div>
          <div className="h-2 rounded-full bg-[var(--surface-tertiary)] overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{
                width: `${Math.min(100, (status.daily_match_count / status.daily_match_limit) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            Resets {formatTimeRemaining(status.daily_match_reset_at)}
          </p>
        </div>
      )}

      {/* Devnet notice */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
        <span>Solana Devnet — use free test SOL. Make sure Phantom is set to <strong>Devnet</strong>.</span>
      </div>

      {/* Wallet connection */}
      <div className="border-t border-[var(--border-light)] pt-4">
        {walletAddress ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-mono text-[var(--text-secondary)]">
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </span>
            </div>
            <button
              onClick={disconnectWallet}
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={loading}
            className="btn-brand w-full flex items-center justify-center gap-2 text-sm py-2.5"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="128" height="128" rx="26" fill="#AB9FF2"/>
                  <path d="M110.584 64.914H99.142C99.142 44.774 82.901 28.534 62.762 28.534C43.155 28.534 27.267 43.894 26.381 63.327C25.443 83.877 42.663 101.466 63.223 101.466H66.762C85.092 101.466 110.584 82.554 110.584 64.914Z" fill="white"/>
                </svg>
                Connect Phantom
              </>
            )}
          </button>
        )}
      </div>

      {/* Plans */}
      {walletAddress && pricing && (
        <div className="space-y-3 border-t border-[var(--border-light)] pt-4">
          <p className="text-sm font-medium text-[var(--text-secondary)]">Get more matches</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {pricing.plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => purchasePlan(plan)}
                disabled={txLoading !== null}
                className={`relative group rounded-xl border p-4 text-left transition-all hover:border-[var(--brand-pink)] hover:shadow-[var(--shadow-glow)] ${
                  txLoading === plan.id
                    ? 'border-[var(--brand-pink)] bg-[#FFF0F3]'
                    : 'border-[var(--border-light)] bg-[var(--surface-secondary)]'
                }`}
              >
                <p className="font-semibold text-sm">{plan.label}</p>
                <p className="text-lg font-bold text-brand mt-1">
                  {lamportsToSol(plan.price_lamports)} SOL
                </p>
                {txLoading === plan.id && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80">
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-pink)]/30 border-t-[var(--brand-pink)]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
