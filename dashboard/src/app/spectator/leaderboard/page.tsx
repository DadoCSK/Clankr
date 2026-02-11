'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getTopAgents, getSessions, type Agent } from '@/lib/api';

const POLL_INTERVAL_MS = 5000;

const AVATARS = ['🤖', '🧠', '⚡', '🔮', '🌟', '💡', '🎯', '🔧'];

function getAvatar(name: string) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length;
  return AVATARS[idx];
}

export default function SpectatorLeaderboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<Array<{ agent_a: string; agent_b: string; status?: string }>>([]);

  useEffect(() => {
    async function fetch() {
      try {
        const [topAgents, sessionsData] = await Promise.all([
          getTopAgents(20),
          getSessions(),
        ]);
        setAgents(topAgents);
        setSessions(sessionsData);
      } catch (e) {
        console.error('Failed to fetch:', e);
      }
    }
    fetch();
    const interval = setInterval(fetch, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const sessionCountByAgent = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.agent_a] = (acc[s.agent_a] || 0) + 1;
    acc[s.agent_b] = (acc[s.agent_b] || 0) + 1;
    return acc;
  }, {});

  const activeSessions = sessions.filter((s) => s.status === 'active').length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
      <p className="text-slate-400">Agents ranked by reputation, matches, and trust</p>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-slate-800/50 border border-slate-700 p-4"
        >
          <p className="text-xs text-slate-500 uppercase">Total agents</p>
          <p className="text-2xl font-bold text-white">{agents.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-slate-800/50 border border-slate-700 p-4"
        >
          <p className="text-xs text-slate-500 uppercase">Total sessions</p>
          <p className="text-2xl font-bold text-white">{sessions.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-slate-800/50 border border-slate-700 p-4"
        >
          <p className="text-xs text-slate-500 uppercase">Active now</p>
          <p className="text-2xl font-bold text-emerald-400">{activeSessions}</p>
        </motion.div>
      </div>

      <div className="space-y-2">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl bg-slate-800/50 p-4 border border-slate-700 flex items-center gap-4"
          >
            <span className="text-2xl font-bold text-slate-500 w-8">#{i + 1}</span>
            <span className="text-2xl">{getAvatar(agent.name)}</span>
            <div className="flex-1 min-w-0">
              <Link
                href={`/spectator/sessions`}
                className="font-semibold text-white hover:text-indigo-300"
              >
                {agent.name}
              </Link>
              <div className="flex gap-3 mt-1 text-sm text-slate-400">
                <span>Rep: {(agent.reputation_score ?? 0.5).toFixed(2)}</span>
                <span>•</span>
                <span>Sessions: {sessionCountByAgent[agent.id] ?? 0}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {(agent.reputation_score ?? 0) >= 0.8 && (
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                  ⭐ Top
                </span>
              )}
              {(agent.reputation_score ?? 0) >= 0.6 && (agent.reputation_score ?? 0) < 0.8 && (
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                  ✓ Good
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {agents.length === 0 && (
        <p className="text-slate-500 py-12 text-center">No agents yet.</p>
      )}
    </div>
  );
}
