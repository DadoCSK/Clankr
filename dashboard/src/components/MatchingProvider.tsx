'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { getAgents, getSessions, getQueuedMatches, type Agent, type Session } from '@/lib/api';

// ── Timing constants ─────────────────────────────────────────────────────────
const DATA_POLL_MS = 5000;            // background data refresh
const MATCH_DISPLAY_MS = 4000;        // how long to show a match result
const IDLE_POLL_MS = 8000;            // poll for new matches when idle

// ── Types ────────────────────────────────────────────────────────────────────
type MatchDisplay = {
  pair: { a: Agent; b: Agent; isMatch: boolean };
  phase: 'evaluating' | 'result';
} | null;

const MatchingContext = createContext<{
  display: MatchDisplay;
  agents: Agent[];
  allMatched: boolean;
}>({ display: null, agents: [], allMatched: false });

export function useMatching() {
  return useContext(MatchingContext);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function agentsChanged(a: Agent[], b: Agent[]): boolean {
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return true;
  }
  return false;
}

function sessionsChanged(a: Session[], b: Session[]): boolean {
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].status !== b[i].status || a[i].current_turn !== b[i].current_turn) return true;
  }
  return false;
}

// ── Provider ─────────────────────────────────────────────────────────────────
// OBSERVE-ONLY: the frontend never triggers matching — it just polls the backend
// for agents, sessions, and the viewer queue (new matches created by the background service).

export function MatchingProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [display, setDisplay] = useState<MatchDisplay>(null);
  const [allMatched, setAllMatched] = useState(false);

  const mountedRef = useRef(true);
  const agentMapRef = useRef<Map<string, Agent>>(new Map());
  const matchQueueRef = useRef<Array<{ agent_a: string; agent_b: string; session_id: string }>>([]);
  const displayingRef = useRef(false);

  // ── Data polling ───────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [agentList, sessionList] = await Promise.all([getAgents(), getSessions()]);
      if (!mountedRef.current) return;
      setAgents((prev) => agentsChanged(prev, agentList) ? agentList : prev);
      setSessions((prev) => sessionsChanged(prev, sessionList) ? sessionList : prev);
      // Update agent lookup map
      const map = new Map<string, Agent>();
      for (const a of agentList) map.set(a.id, a);
      agentMapRef.current = map;
    } catch (e) {
      console.error('Failed to fetch data:', e);
    }
  }, []);

  // ── Poll viewer queue for new matches ──────────────────────────────────────
  const pollMatches = useCallback(async () => {
    try {
      const data = await getQueuedMatches();
      if (!mountedRef.current) return;
      const matches = data.matches || [];
      if (matches.length > 0) {
        matchQueueRef.current.push(...matches);
      }
    } catch {
      // viewer queue endpoint may not be available
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    const dataInterval = setInterval(fetchData, DATA_POLL_MS);
    const matchInterval = setInterval(pollMatches, DATA_POLL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(dataInterval);
      clearInterval(matchInterval);
    };
  }, [fetchData, pollMatches]);

  // ── Display loop: show queued matches one at a time ────────────────────────
  useEffect(() => {
    if (agents.length < 2) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    function showNext() {
      if (!mountedRef.current) return;

      const next = matchQueueRef.current.shift();
      if (next) {
        const agentA = agentMapRef.current.get(next.agent_a);
        const agentB = agentMapRef.current.get(next.agent_b);

        if (agentA && agentB) {
          setAllMatched(false);
          displayingRef.current = true;

          // Show "evaluating" briefly, then result
          setDisplay({ pair: { a: agentA, b: agentB, isMatch: false }, phase: 'evaluating' });

          timer = setTimeout(() => {
            if (!mountedRef.current) return;
            setDisplay({ pair: { a: agentA, b: agentB, isMatch: true }, phase: 'result' });
            fetchData(); // refresh sessions list

            timer = setTimeout(() => {
              displayingRef.current = false;
              showNext();
            }, MATCH_DISPLAY_MS);
          }, 1500); // evaluating phase duration
        } else {
          // Agents not in map yet — skip, try next
          showNext();
        }
      } else {
        // Queue empty — check if all agents are fully matched
        // (all have active sessions or no new matches coming in)
        displayingRef.current = false;
        setDisplay(null);

        // Simple heuristic: if no new matches in a while, show "all matched"
        // We'll re-check on next poll
        timer = setTimeout(() => {
          if (!mountedRef.current) return;
          if (matchQueueRef.current.length > 0) {
            showNext();
          } else {
            // Check if there are active sessions — if yes and queue empty, show idle
            setAllMatched(true);
            timer = setTimeout(showNext, IDLE_POLL_MS);
          }
        }, IDLE_POLL_MS);
      }
    }

    showNext();

    return () => {
      if (timer) clearTimeout(timer);
      displayingRef.current = false;
    };
  }, [agents.length >= 2, fetchData]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <MatchingContext.Provider value={{ display, agents, allMatched }}>
      {children}
    </MatchingContext.Provider>
  );
}
