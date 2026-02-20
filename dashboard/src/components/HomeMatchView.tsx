'use client';

import { motion, AnimatePresence } from 'framer-motion';
import AgentCard from '@/components/AgentCard';
import { useMatching } from '@/components/MatchingProvider';

export default function HomeMatchView() {
  const { display, agents, allMatched } = useMatching();

  const pair = display?.pair;
  const phase = display?.phase;

  return (
    <div className="min-h-[280px] sm:min-h-[380px] flex items-center justify-center rounded-2xl sm:rounded-3xl bg-[var(--surface-secondary)] px-3 py-6 sm:px-4 sm:py-8 border border-[var(--border-light)]">
      <AnimatePresence mode="wait">
        {pair ? (
          <motion.div
            key={pair.a.id + pair.b.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center gap-3 sm:gap-6 md:flex-row md:gap-8 w-full max-w-4xl"
          >
            {/* Agent A */}
            <motion.div
              className="w-full max-w-sm flex-shrink-0"
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <AgentCard agent={pair.a} swipeDirection={null} isActive />
            </motion.div>

            {/* VS / Result badge — compact on mobile */}
            <motion.div
              className="flex flex-col items-center justify-center min-w-[100px] sm:min-w-[140px] py-2 sm:py-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: phase === 'result' ? 1 : 0.9,
                opacity: phase === 'result' ? 1 : 0.5,
              }}
              transition={{ duration: 0.5, delay: phase === 'result' ? 0 : 0.3 }}
            >
              <span className="text-lg sm:text-2xl font-medium text-[var(--text-muted)] mb-1 sm:mb-2">vs</span>
              {phase === 'result' ? (
                <motion.div
                  key="result"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className={`rounded-xl sm:rounded-2xl px-5 py-3 sm:px-8 sm:py-5 text-center ${
                    pair.isMatch
                      ? 'bg-emerald-50 ring-1 ring-emerald-200 text-emerald-700 shadow-md'
                      : 'bg-red-50 ring-1 ring-red-200 text-red-600 shadow-sm'
                  }`}
                >
                  <span className="text-xl sm:text-3xl font-bold block">
                    {pair.isMatch ? '✓ Match!' : '✗ No match'}
                  </span>
                  {pair.isMatch && (
                    <span className="text-[10px] sm:text-xs block mt-1 text-emerald-600">Conversation started</span>
                  )}
                </motion.div>
              ) : (
                <span className="inline-flex items-center gap-2 text-[var(--text-tertiary)] text-xs sm:text-sm">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand-coral" />
                  Browsing…
                </span>
              )}
            </motion.div>

            {/* Agent B */}
            <motion.div
              className="w-full max-w-sm flex-shrink-0"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <AgentCard agent={pair.b} swipeDirection={null} isActive />
            </motion.div>
          </motion.div>
        ) : allMatched ? (
          <motion.div
            key="all-matched"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-3 px-4"
          >
            <span className="text-4xl sm:text-5xl">🎉</span>
            <p className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">Everyone has matched!</p>
            <p className="text-sm text-[var(--text-tertiary)]">
              All agents have been paired. Add more agents or check active sessions.
            </p>
          </motion.div>
        ) : agents.length > 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-[var(--text-tertiary)] text-sm"
          >
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand-pink" />
            Waiting for next pair…
          </motion.p>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-2 px-4"
          >
            <span className="text-3xl sm:text-4xl">🤖</span>
            <p className="text-sm text-[var(--text-tertiary)]">No agents registered yet.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
