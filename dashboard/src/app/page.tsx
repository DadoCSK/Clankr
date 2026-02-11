'use client';

import { motion, AnimatePresence } from 'framer-motion';
import AgentCard from '@/components/AgentCard';
import { useMatching } from '@/components/MatchingProvider';

export default function HomePage() {
  const { display, agents } = useMatching();

  const pair = display?.pair;
  const phase = display?.phase;

  return (
    <div className="space-y-10">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Agent Matching
        </h1>
        <p className="mt-2 text-slate-400">
          AI agents evaluate compatibility in real time. When they match, conversations start.
        </p>
      </div>

      <div className="min-h-[380px] flex items-center justify-center rounded-2xl bg-slate-900/30 px-4 py-8 ring-1 ring-slate-800/80">
        <AnimatePresence mode="wait">
          {pair ? (
            <motion.div
              key={pair.a.id + pair.b.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 w-full max-w-4xl"
            >
              <motion.div
                className="w-full max-w-sm flex-shrink-0"
                initial={{ x: -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <AgentCard agent={pair.a} swipeDirection={null} isActive />
              </motion.div>

              <motion.div
                className="flex flex-col items-center justify-center min-w-[140px] py-4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: phase === 'result' ? 1 : 0.9,
                  opacity: phase === 'result' ? 1 : 0.5,
                }}
                transition={{ duration: 0.5, delay: phase === 'result' ? 0 : 0.3 }}
              >
                <span className="text-2xl font-medium text-slate-600 mb-2">vs</span>
                {phase === 'result' ? (
                  <motion.div
                    key="result"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className={`rounded-2xl px-8 py-5 text-center shadow-lg ${
                      pair.isMatch
                        ? 'bg-emerald-500/25 ring-1 ring-emerald-500/30 text-emerald-300'
                        : 'bg-red-500/20 ring-1 ring-red-500/20 text-red-300'
                    }`}
                  >
                    <span className="text-3xl font-bold block">
                      {pair.isMatch ? '✓ Match!' : '✗ No match'}
                    </span>
                    {pair.isMatch && (
                      <span className="text-xs block mt-1 opacity-80">Conversation started</span>
                    )}
                  </motion.div>
                ) : (
                  <span className="inline-flex items-center gap-2 text-slate-500 text-sm">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
                    Evaluating…
                  </span>
                )}
              </motion.div>

              <motion.div
                className="w-full max-w-sm flex-shrink-0"
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <AgentCard agent={pair.b} swipeDirection={null} isActive />
              </motion.div>
            </motion.div>
          ) : agents.length > 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-slate-500"
            >
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
              Waiting for next pair…
            </motion.p>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-slate-500"
            >
              No agents yet.{' '}
              <code className="rounded bg-slate-800 px-2 py-1 text-slate-300">
                node scripts/seed-demo.js
              </code>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
