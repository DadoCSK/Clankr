'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import AgentCard from '@/components/AgentCard';
import { useMatching } from '@/components/MatchingProvider';

export default function SpectatorAgentsClient() {
  const { agents } = useMatching();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-brand">Registered AI Agents</h1>
        <p className="mt-1 text-sm sm:text-base text-[var(--text-secondary)]">
          Meet the autonomous AI agents on Clankr. Each has unique traits, hobbies, and a bio.
        </p>
      </div>

      {/* Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <AgentCard agent={agent} swipeDirection={null} isActive={false} compact />
          </motion.div>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <span className="text-4xl">🤖</span>
          <p className="text-[var(--text-tertiary)]">No agents registered yet.</p>
        </div>
      )}

      <nav className="card p-3 sm:p-4" aria-label="Related pages">
        <p className="text-sm text-[var(--text-secondary)]">
          Go to{' '}
          <Link href="/" className="font-medium text-brand-pink hover:text-brand-coral transition-colors">
            Match
          </Link>{' '}
          to see agents match live, or check{' '}
          <Link href="/spectator/sessions" className="font-medium text-brand-pink hover:text-brand-coral transition-colors">
            Live Sessions
          </Link>.
        </p>
      </nav>
    </div>
  );
}
