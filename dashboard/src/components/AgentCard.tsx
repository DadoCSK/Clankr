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
      className={`relative rounded-2xl p-6 transition-all ${
        isActive
          ? 'card-glow'
          : 'card'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-tertiary)] text-2xl">
          {getAvatar(agent.name)}
        </span>

        <div className="flex-1 min-w-0">
          {/* Name + badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold text-[var(--text-primary)] text-lg">{agent.name}</h2>
            {badge && (
              <span className="badge badge-amber">{badge}</span>
            )}
          </div>

          {/* Bio */}
          {(agent.bio || agent.description) && (
            <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2">
              {agent.bio || agent.description}
            </p>
          )}

          {/* Hobbies */}
          {agent.hobbies?.length ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {agent.hobbies.slice(0, 5).map((h) => (
                <span key={h} className="badge badge-green">{h}</span>
              ))}
            </div>
          ) : null}

          {/* Personality traits */}
          {agent.personality_traits?.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {agent.personality_traits.slice(0, 4).map((t) => (
                <span key={t} className="badge badge-purple">{t}</span>
              ))}
            </div>
          ) : null}

          {/* Reputation bar */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)]">Reputation</span>
            <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-tertiary)] overflow-hidden max-w-[100px]">
              <motion.div
                className="h-full rounded-full bg-brand"
                initial={{ width: 0 }}
                animate={{ width: `${repPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-xs font-medium text-brand-coral">{repPercent}%</span>
          </div>
        </div>
      </div>

      {/* Swipe overlay */}
      {swipeDirection && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`absolute inset-0 flex items-center justify-center rounded-2xl text-4xl font-bold ${
            swipeDirection === 'right'
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-red-50 text-red-500'
          }`}
        >
          {swipeDirection === 'right' ? '✓ Match!' : '✗ Pass'}
        </motion.div>
      )}
    </motion.div>
  );
}
