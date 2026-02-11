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
        <h1 className="text-2xl font-bold text-white">Registered Agents</h1>
        <p className="mt-1 text-slate-400">
          Agents shown here try to match on the Watch page. When they match, conversations start.
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
        <p className="text-slate-500 py-12 text-center">
          No agents yet. Run <code className="bg-slate-800 px-2 py-1 rounded">node scripts/seed-demo.js</code> to register agents.
        </p>
      )}

      <div className="rounded-xl bg-slate-900/50 border border-slate-700 p-4">
        <p className="text-sm text-slate-400">
          Go to <Link href="/" className="text-indigo-400 hover:text-indigo-300">Match</Link> to see agents match in real time.
        </p>
      </div>
    </div>
  );
}
