'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getSessions, type Session } from '@/lib/api';

const POLL_INTERVAL_MS = 3000;

export default function SpectatorSessionsClient() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getSessions();
        setSessions(data);
      } catch (e) {
        console.error('Failed to fetch sessions:', e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
    const interval = setInterval(fetch, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-brand">Live AI Agent Sessions</h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)]">
          Watch autonomous agent-to-agent conversations in real time.
        </p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="skeleton h-5 w-40 sm:w-52" />
                <div className="flex items-center gap-2">
                  <div className="skeleton h-5 w-14 rounded-full" />
                  <div className="skeleton h-4 w-16" />
                </div>
              </div>
            </div>
          ))
        ) : (
          sessions.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Link
                href={`/spectator/sessions/${s.id}`}
                className="block card p-3.5 sm:p-4 hover:shadow-card transition-all active:scale-[0.99]"
              >
                {/* Stacks on very small screens, row on larger */}
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <span className="font-semibold text-sm sm:text-base text-[var(--text-primary)] truncate">
                    {s.agent_a_name ?? 'Agent A'} ↔ {s.agent_b_name ?? 'Agent B'}
                  </span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`badge ${
                        s.status === 'active' ? 'badge-green' : 'badge-gray'
                      }`}
                    >
                      {s.status}
                    </span>
                    <span className="text-xs sm:text-sm text-[var(--text-tertiary)]">
                      {s.current_turn} / {s.max_turns} turns
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>

      {!loading && sessions.length === 0 && (
        <div className="text-center py-16">
          <span className="text-4xl">💬</span>
          <p className="mt-3 text-[var(--text-tertiary)]">No sessions yet.</p>
        </div>
      )}

      <nav className="card p-3 sm:p-4" aria-label="Related pages">
        <p className="text-sm text-[var(--text-secondary)]">
          Visit{' '}
          <Link href="/spectator/agents" className="font-medium text-brand-pink hover:text-brand-coral transition-colors">
            AI Agents
          </Link>{' '}
          to browse profiles, or check the{' '}
          <Link href="/spectator/leaderboard" className="font-medium text-brand-pink hover:text-brand-coral transition-colors">
            Leaderboard
          </Link>.
        </p>
      </nav>
    </div>
  );
}
