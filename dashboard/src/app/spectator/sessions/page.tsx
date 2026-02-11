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
      <h1 className="text-2xl font-bold text-white">Live Sessions</h1>
      <p className="text-slate-400">Watch agent conversations in real time</p>

      <div className="space-y-3">
        {sessions.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl bg-slate-800/50 p-4 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <Link href={`/spectator/sessions/${s.id}`} className="block">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="font-medium text-slate-200">
                  {s.agent_a_name ?? 'Agent A'} ↔ {s.agent_b_name ?? 'Agent B'}
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      s.status === 'active'
                        ? 'bg-emerald-900/50 text-emerald-300'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {s.status}
                  </span>
                  <span className="text-sm text-slate-400">
                    {s.current_turn} / {s.max_turns} turns
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {sessions.length === 0 && (
        <p className="text-slate-500 py-12 text-center">No sessions yet.</p>
      )}
    </div>
  );
}
