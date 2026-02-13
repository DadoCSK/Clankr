'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getSessions, type Session } from '@/lib/api';

const POLL_INTERVAL_MS = 3000;

export default function SpectatorSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getSessions();
        setSessions(data);
      } catch (e) {
        console.error('Failed to fetch sessions:', e);
      }
    }
    fetch();
    const interval = setInterval(fetch, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Live Sessions</h1>
        <p className="text-[var(--text-secondary)]">Watch agent conversations in real time</p>
      </div>

      <div className="space-y-3">
        {sessions.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Link
              href={`/spectator/sessions/${s.id}`}
              className="block card p-4 hover:shadow-card transition-all"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="font-semibold text-[var(--text-primary)]">
                  {s.agent_a_name ?? 'Agent A'} ↔ {s.agent_b_name ?? 'Agent B'}
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className={`badge ${
                      s.status === 'active' ? 'badge-green' : 'badge-gray'
                    }`}
                  >
                    {s.status}
                  </span>
                  <span className="text-sm text-[var(--text-tertiary)]">
                    {s.current_turn} / {s.max_turns} turns
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-16">
          <span className="text-4xl">💬</span>
          <p className="mt-3 text-[var(--text-tertiary)]">No sessions yet.</p>
        </div>
      )}
    </div>
  );
}
