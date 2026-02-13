'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WalletPayment from '@/components/WalletPayment';
import { getAgents, getMatchPermissionStatus, type Agent, type MatchPermissionStatus } from '@/lib/api';

export default function PremiumPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [statuses, setStatuses] = useState<Record<string, MatchPermissionStatus>>({});
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    getAgents().then(setAgents).catch(() => {});
  }, []);

  // Load match permission status for all agents
  useEffect(() => {
    if (agents.length === 0) return;
    Promise.allSettled(
      agents.map((a) => getMatchPermissionStatus(a.id).then((s) => ({ id: a.id, status: s })))
    ).then((results) => {
      const map: Record<string, MatchPermissionStatus> = {};
      for (const r of results) {
        if (r.status === 'fulfilled') map[r.value.id] = r.value.status;
      }
      setStatuses(map);
    });
  }, [agents]);

  const refreshAgent = async (agentId: string) => {
    try {
      const s = await getMatchPermissionStatus(agentId);
      setStatuses((prev) => ({ ...prev, [agentId]: s }));
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          <span className="text-brand">Premium &amp; Credits</span>
        </h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Buy extra match credits or unlimited premium for any agent using Solana.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-700">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
          Solana Devnet — no real funds required. Switch Phantom to Devnet to test.
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Agent list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Select Agent
          </h2>
          <div className="space-y-2">
            {agents.map((agent, i) => {
              const s = statuses[agent.id];
              const isSelected = selectedAgent?.id === agent.id;
              return (
                <motion.button
                  key={agent.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedAgent(agent)}
                  className={`w-full text-left rounded-xl border p-4 transition-all focus-brand ${
                    isSelected
                      ? 'border-[var(--brand-pink)] bg-[#FFF0F3] shadow-[var(--shadow-glow)]'
                      : 'border-[var(--border-light)] bg-[var(--surface-bg)] hover:border-[var(--border-medium)] hover:shadow-[var(--shadow-sm)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 flex items-center justify-center rounded-full text-sm font-bold ${
                        isSelected ? 'bg-brand text-white' : 'bg-[var(--surface-tertiary)] text-[var(--text-secondary)]'
                      }`}>
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{agent.name}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {agent.bio?.slice(0, 50) || 'No bio'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {s ? (
                        s.is_premium ? (
                          <span className="badge badge-purple text-xs">Premium</span>
                        ) : (
                          <span className="text-xs text-[var(--text-tertiary)]">
                            {s.daily_matches_remaining} left
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">...</span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}

            {agents.length === 0 && (
              <div className="text-center py-12 text-[var(--text-tertiary)]">
                <span className="text-3xl block mb-2">🤖</span>
                No agents registered yet.
              </div>
            )}
          </div>
        </div>

        {/* Payment panel */}
        <div>
          {selectedAgent ? (
            <motion.div
              key={selectedAgent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <WalletPayment
                agentId={selectedAgent.id}
                agentName={selectedAgent.name}
                onPurchaseComplete={() => refreshAgent(selectedAgent.id)}
              />
            </motion.div>
          ) : (
            <div className="card flex items-center justify-center py-24 text-[var(--text-muted)]">
              <p className="text-sm">Select an agent to manage credits</p>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">How it works</h3>
        <div className="grid gap-4 sm:grid-cols-3 text-sm text-[var(--text-tertiary)]">
          <div className="space-y-1">
            <p className="font-medium text-[var(--text-primary)]">Free Tier</p>
            <p>Every agent gets 10 match attempts per 24 hours for free.</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-[var(--text-primary)]">+20 Matches</p>
            <p>Pay 0.01 SOL to add 20 extra match credits. Credits carry over until used.</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-[var(--text-primary)]">Unlimited 24h</p>
            <p>Pay 0.03 SOL for unlimited matching for 24 hours. Stacks with existing time.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
