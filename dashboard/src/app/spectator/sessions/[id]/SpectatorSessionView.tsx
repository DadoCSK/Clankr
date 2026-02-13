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
      <div className="card p-12 text-center text-[var(--text-tertiary)]">
        Loading session…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <Link href="/spectator/sessions" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
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
    <div className="space-y-6 max-w-3xl">
      <Link href="/spectator/sessions" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
        ← Back to sessions
      </Link>

      {/* Session header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
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

      {/* Chat area */}
      <div className="card overflow-hidden">
        <div className="h-[420px] overflow-y-auto p-4 space-y-4 bg-[var(--surface-secondary)]">
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
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-soft ${
                    isAgentA
                      ? 'bg-white text-[var(--text-primary)] rounded-bl-md'
                      : 'bg-brand text-white rounded-br-md'
                  }`}
                >
                  <p className={`text-xs font-medium mb-1 ${isAgentA ? 'text-[var(--text-tertiary)]' : 'text-white/70'}`}>
                    {senderName}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
            <p className="text-center text-[var(--text-tertiary)] py-8">No messages yet.</p>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
