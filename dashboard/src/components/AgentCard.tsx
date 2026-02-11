'use client';

import { motion } from 'framer-motion';
import type { Agent } from '@/lib/api';

const AVATARS = ['🤖', '🧠', '⚡', '🔮', '🌟', '💡', '🎯', '🔧'];

function getAvatar(name: string) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length;
  return AVATARS[idx];
}

interface AgentCardProps {
  agent: Agent;
  swipeDirection?: 'left' | 'right' | null;
  isActive?: boolean;
}

export default function AgentCard({ agent, swipeDirection, isActive = true }: AgentCardProps) {
  const rep = agent.reputation_score ?? 0.5;
  const repPercent = Math.round(rep * 100);
  const badge =
    rep >= 0.8 ? '⭐ Top' : rep >= 0.6 ? '✓ Good' : rep >= 0.4 ? '·' : null;

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        x: swipeDirection === 'left' ? -400 : swipeDirection === 'right' ? 400 : 0,
        opacity: swipeDirection ? 0 : 1,
        rotate: swipeDirection === 'left' ? -15 : swipeDirection === 'right' ? 15 : 0,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`relative rounded-2xl border p-6 shadow-lg transition-colors ${
        isActive
          ? 'border-indigo-500/40 bg-slate-800/80 ring-2 ring-indigo-500/20'
          : 'border-slate-700/80 bg-slate-800/50'
      }`}
    >
      <div className="flex items-start gap-4">
        <span className="text-4xl">{getAvatar(agent.name)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold text-white text-lg">{agent.name}</h2>
            {badge && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
                {badge}
              </span>
            )}
          </div>
          {agent.description && (
            <p className="mt-1 text-sm text-slate-400 line-clamp-2">{agent.description}</p>
          )}
          {agent.capabilities?.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {agent.capabilities.slice(0, 4).map((c) => (
                <span
                  key={c}
                  className="rounded bg-emerald-900/40 px-2 py-0.5 text-xs text-emerald-300"
                >
                  {c}
                </span>
              ))}
            </div>
          ) : null}
          {agent.goals?.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {agent.goals.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="rounded bg-slate-700/80 px-2 py-0.5 text-xs text-slate-300"
                >
                  {g}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500">Reputation</span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden max-w-[100px]">
              <motion.div
                className="h-full bg-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${repPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-xs text-amber-400">{repPercent}%</span>
          </div>
        </div>
      </div>
      {swipeDirection && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`absolute inset-0 flex items-center justify-center rounded-2xl text-4xl font-bold ${
            swipeDirection === 'right'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {swipeDirection === 'right' ? '✓ Match!' : '✗ Pass'}
        </motion.div>
      )}
    </motion.div>
  );
}
