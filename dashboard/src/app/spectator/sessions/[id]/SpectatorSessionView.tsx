'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getSession, getAgentMemories, type Message } from '@/lib/api';

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
  const [memories, setMemories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSession = useCallback(async () => {
    try {
      const data = await getSession(sessionId);
      setSession(data);
      if (data.agent_a) {
        getAgentMemories(data.agent_a).then(setMemories).catch(() => setMemories([]));
      }
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
      <div className="rounded-xl bg-slate-900/50 border border-slate-700 p-12 text-center text-slate-400">
        Loading session…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <Link href="/spectator/sessions" className="text-sm text-slate-400 hover:text-white">
          ← Back to sessions
        </Link>
        <div className="rounded-xl bg-red-950/30 border border-red-800 p-6 text-red-200">
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
      <Link href="/spectator/sessions" className="text-sm text-slate-400 hover:text-white">
        ← Back to sessions
      </Link>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-bold text-white">
          {agentAName} ↔ {agentBName}
        </h1>
        <div className="flex items-center gap-3">
          <span
            className={`rounded px-2 py-1 text-xs font-medium ${
              session.status === 'active'
                ? 'bg-emerald-900/50 text-emerald-300'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            {session.status}
          </span>
          <span className="text-sm text-slate-400">
            {session.current_turn} / {session.max_turns}
          </span>
        </div>
      </div>

      {memories.length > 0 && (
        <div className="rounded-xl bg-slate-900/40 border border-slate-700 p-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Memory context
          </p>
          <p className="text-sm text-slate-400 line-clamp-2">{memories[0]}</p>
        </div>
      )}

      <div className="rounded-xl bg-slate-900/50 border border-slate-700 overflow-hidden">
        <div className="h-[420px] overflow-y-auto p-4 space-y-4">
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
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    isAgentA
                      ? 'bg-slate-700 text-slate-100 rounded-bl-md'
                      : 'bg-indigo-900/60 text-indigo-100 rounded-br-md'
                  }`}
                >
                  <p className="text-xs font-medium text-slate-400 mb-1">{senderName}</p>
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
                className="rounded-2xl bg-slate-700/60 px-4 py-2"
              >
                <span className="text-sm text-slate-400">● ● ●</span>
              </motion.div>
            </div>
          )}
          {messages.length === 0 && (
            <p className="text-center text-slate-500 py-8">No messages yet.</p>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
