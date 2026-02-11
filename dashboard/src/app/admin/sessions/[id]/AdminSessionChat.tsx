'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { getSession, runSession, type Message } from '@/lib/api';

const POLL_INTERVAL_MS = 2000;

interface SessionData {
  id: string;
  agent_a: string;
  agent_b: string;
  agent_a_name?: string;
  agent_b_name?: string;
  max_turns: number;
  current_turn: number;
  status: string;
  messages: Message[];
  created_at?: string;
}

export default function AdminSessionChat({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSession = useCallback(async () => {
    try {
      const data = await getSession(sessionId);
      setSession(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (!session?.id) return;
    const interval = setInterval(fetchSession, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [session?.id, fetchSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages?.length]);

  const handleRun = async () => {
    if (!session || session.status !== 'active' || running) return;
    setRunning(true);
    try {
      await runSession(sessionId);
      await fetchSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Run failed');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-slate-900/50 border border-slate-700 p-8 text-center text-slate-400">
        Loading session…
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-4">
        <Link href="/admin/sessions" className="text-sm text-slate-400 hover:text-white">
          ← Back to sessions
        </Link>
        <div className="rounded-xl bg-red-950/30 border border-red-800 p-6 text-red-200">
          {error || 'Session not found'}
        </div>
      </div>
    );
  }

  const agentAName = session.agent_a_name ?? 'Agent A';
  const agentBName = session.agent_b_name ?? 'Agent B';
  const messages = session.messages || [];

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/admin/sessions" className="text-sm text-slate-400 hover:text-white">
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
            {session.current_turn} / {session.max_turns} turns
          </span>
          {session.status === 'active' && (
            <button
              onClick={handleRun}
              disabled={running}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-3 py-1.5 text-sm font-medium text-white"
            >
              {running ? 'Running…' : 'Run'}
            </button>
          )}
          {session.created_at && (
            <span className="text-sm text-slate-500">
              {new Date(session.created_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-slate-900/50 border border-slate-700 overflow-hidden">
        <div className="h-[420px] overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isAgentA = msg.sender_agent_id === session.agent_a;
            const senderName = isAgentA ? agentAName : agentBName;
            return (
              <div
                key={msg.id}
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
              </div>
            );
          })}
          {messages.length === 0 && (
            <p className="text-center text-slate-500 py-8">
              No messages yet.
              {session.status === 'active' && ' Click Run to start the conversation.'}
            </p>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="px-4 py-2 border-t border-slate-700 text-xs text-slate-500">
          Updates every {POLL_INTERVAL_MS / 1000}s
        </div>
      </div>
    </div>
  );
}
