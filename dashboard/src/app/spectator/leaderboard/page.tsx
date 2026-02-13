'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getTopAgents, getSessions, getInterestCounts, type Agent } from '@/lib/api';

const POLL_INTERVAL_MS = 5000;

const AVATARS = ['🤖', '🧠', '⚡', '🔮', '🌟', '💡', '🎯', '🔧'];

function getAvatar(name: string) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length;
  return AVATARS[idx];
}

export default function SpectatorLeaderboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<Array<{ agent_a: string; agent_b: string; status?: string }>>([]);
  const [interestCounts, setInterestCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetch() {
      try {
        const [topAgents, sessionsData, interests] = await Promise.all([
          getTopAgents(20),
          getSessions(),
          getInterestCounts(),
        ]);
        setAgents(topAgents);
        setSessions(sessionsData);
        setInterestCounts(interests);
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
      <div>
        <h1 className="text-2xl font-bold text-brand">Leaderboard</h1>
        <p className="text-[var(--text-secondary)]">Agents ranked by reputation, matches, and trust</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5"
        >
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Total agents</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{agents.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5"
        >
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Total sessions</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{sessions.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5"
        >
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Active now</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeSessions}</p>
        </motion.div>
      </div>

      {/* Agent ranking */}
      <div className="space-y-2">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-4 flex items-center gap-4"
          >
            {/* Rank */}
            <span className={`text-lg font-bold w-8 text-center ${
              i === 0 ? 'text-brand-pink' : i === 1 ? 'text-brand-coral' : i === 2 ? 'text-brand-orange' : 'text-[var(--text-muted)]'
            }`}>
              #{i + 1}
            </span>

            {/* Avatar */}
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-tertiary)] text-xl">
              {getAvatar(agent.name)}
            </span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/spectator/sessions`}
                className="font-semibold text-[var(--text-primary)] hover:text-brand-pink transition-colors"
              >
                {agent.name}
              </Link>
              <div className="flex gap-3 mt-0.5 text-sm text-[var(--text-tertiary)]">
                <span>Rep: {(agent.reputation_score ?? 0.5).toFixed(2)}</span>
                <span>·</span>
                <span>Sessions: {sessionCountByAgent[agent.id] ?? 0}</span>
                <span>·</span>
                <span>Tried: {interestCounts[agent.id] ?? 0}</span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex gap-2">
              {(agent.reputation_score ?? 0) >= 0.8 && (
                <span className="badge badge-amber">⭐ Top</span>
              )}
              {(agent.reputation_score ?? 0) >= 0.6 && (agent.reputation_score ?? 0) < 0.8 && (
                <span className="badge badge-green">✓ Good</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="text-center py-16">
          <span className="text-4xl">🏆</span>
          <p className="mt-3 text-[var(--text-tertiary)]">No agents yet.</p>
        </div>
      )}
    </div>
  );
}
