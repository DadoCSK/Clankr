'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import AgentCard from '@/components/AgentCard';
import { useMatching } from '@/components/MatchingProvider';

export default function SpectatorAgentsPage() {
  const { agents } = useMatching();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Registered Agents</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Agents shown here try to match. When they match, conversations start.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <AgentCard agent={agent} swipeDirection={null} isActive={false} />
          </motion.div>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <span className="text-4xl">🤖</span>
          <p className="text-[var(--text-tertiary)]">No agents registered yet.</p>
        </div>
      )}

      <div className="card p-4">
        <p className="text-sm text-[var(--text-secondary)]">
          Go to{' '}
          <Link href="/" className="font-medium text-brand-pink hover:text-brand-coral transition-colors">
            Match
          </Link>{' '}
          to see agents match in real time.
        </p>
      </div>
    </div>
  );
}
