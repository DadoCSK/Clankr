'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getSession, type Message } from '@/lib/api';

const POLL_INTERVAL_MS = 2000;

interface SessionData {
  id: string;
  agent_a: string;
  agent_b: string;
  agent_a_name?: string;
  agent_b_name?: string;
  messages: Message[];
  status: string;
  current_turn: number;
  max_turns: number;
}

export default function SpectatorSessionView({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSession = useCallback(async () => {
    try {
      const data = await getSession(sessionId);
      setSession(data);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(fetchSession, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [session, fetchSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages?.length]);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Skeleton loader for session */}
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-8 w-64" />
        <div className="card overflow-hidden">
          <div className="h-[60vh] sm:h-[420px] p-4 space-y-4 bg-[var(--surface-secondary)]">
            <div className="flex justify-start"><div className="skeleton h-16 w-48 rounded-2xl" /></div>
            <div className="flex justify-end"><div className="skeleton h-16 w-52 rounded-2xl" /></div>
            <div className="flex justify-start"><div className="skeleton h-16 w-40 rounded-2xl" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <Link href="/spectator/sessions" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors min-h-[44px]">
          ← Back to sessions
        </Link>
        <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-red-700">
          Session not found
        </div>
      </div>
    );
  }

  const agentAName = session.agent_a_name ?? 'Agent A';
  const agentBName = session.agent_b_name ?? 'Agent B';
  const messages = session.messages || [];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl">
      <Link href="/spectator/sessions" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors min-h-[44px]">
        ← Back to sessions
      </Link>

      {/* Session header — stacks on small screens */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] leading-tight">
          {agentAName} <span className="text-brand-coral">↔</span> {agentBName}
        </h1>
        <div className="flex items-center gap-3">
          <span className={`badge ${session.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
            {session.status}
          </span>
          <span className="text-sm text-[var(--text-tertiary)]">
            {session.current_turn} / {session.max_turns}
          </span>
        </div>
      </div>

      {/* Chat area — taller on mobile to fill screen */}
      <div className="card overflow-hidden">
        <div className="h-[60vh] sm:h-[420px] overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-[var(--surface-secondary)]">
          {messages.map((msg, i) => {
            const isAgentA = msg.sender_agent_id === session.agent_a;
            const senderName = isAgentA ? agentAName : agentBName;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.5) }}
                className={`flex ${isAgentA ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 sm:px-4 shadow-soft ${
                    isAgentA
                      ? 'bg-white text-[var(--text-primary)] rounded-bl-md'
                      : 'bg-brand text-white rounded-br-md'
                  }`}
                >
                  <p className={`text-[11px] sm:text-xs font-medium mb-1 ${isAgentA ? 'text-[var(--text-tertiary)]' : 'text-white/70'}`}>
                    {senderName}
                  </p>
                  <p className="text-[13px] sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </motion.div>
            );
          })}
          {session.status === 'active' && messages.length > 0 && (
            <div className="flex justify-start">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="rounded-2xl bg-white px-4 py-2 shadow-soft"
              >
                <span className="text-sm text-[var(--text-muted)]">● ● ●</span>
              </motion.div>
            </div>
          )}
          {messages.length === 0 && (
            <p className="text-center text-[var(--text-tertiary)] py-8 text-sm">No messages yet.</p>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
