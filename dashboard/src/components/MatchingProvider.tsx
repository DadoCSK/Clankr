'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { getAgents, getPairScore, startSession, runSession, type Agent } from '@/lib/api';

const EVALUATING_TO_RESULT_MS = 800;
const RESULT_VIEW_MS = 3500;
const MATCH_TO_SESSION_DELAY_MS = 2000;

type MatchState = {
  pair: { a: Agent; b: Agent; isMatch: boolean; score?: number };
  phase: 'evaluating' | 'result';
} | null;

const MatchingContext = createContext<{
  display: MatchState;
  agents: Agent[];
}>({ display: null, agents: [] });

export function useMatching() {
  return useContext(MatchingContext);
}

export function MatchingProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [display, setDisplay] = useState<MatchState>(null);
  const indexRef = useRef(0);
  const scheduledRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agentsRef = useRef<Agent[]>([]);
  agentsRef.current = agents;

  const fetchAgents = useCallback(async () => {
    try {
      const list = await getAgents();
      setAgents(list);
    } catch (e) {
      console.error('Failed to fetch agents:', e);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 4000);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  useEffect(() => {
    if (agents.length < 2) return;

    const scheduleNext = () => {
      scheduledRef.current = setTimeout(() => {
        runCycle();
      }, RESULT_VIEW_MS);
    };

    const runCycle = () => {
      const list = agentsRef.current;
      if (list.length < 2) return;
      const idx = indexRef.current;
      const a = list[idx % list.length];
      const b = list[(idx + 1) % list.length];
      if (!a?.id || !b?.id) {
        indexRef.current += 1;
        scheduleNext();
        return;
      }
      indexRef.current += 1;

      setDisplay({
        pair: { a, b, isMatch: false, score: undefined },
        phase: 'evaluating',
      });

      getPairScore(a.id, b.id)
        .then(({ compatibility_score: score }) => {
          const isMatch = score >= 7;
          setDisplay((prev) => {
            if (!prev || prev.pair.a.id !== a.id || prev.pair.b.id !== b.id) return prev;
            return {
              pair: { a, b, isMatch, score },
              phase: 'evaluating',
            };
          });
          setTimeout(() => {
            setDisplay((prev) => {
              if (!prev || prev.pair.a.id !== a.id || prev.pair.b.id !== b.id) return prev;
              return { ...prev, phase: 'result' };
            });
            scheduleNext();
          }, EVALUATING_TO_RESULT_MS);
          if (isMatch) {
            startSession(a.id, b.id)
              .then(({ session_id }) => {
                setTimeout(
                  () => runSession(session_id).catch((e) => console.error('Failed to run session:', e)),
                  MATCH_TO_SESSION_DELAY_MS
                );
              })
              .catch((e) => console.error('Failed to start session:', e));
          }
        })
        .catch((e) => {
          console.error('getPairScore failed:', e);
          setDisplay((prev) => {
            if (!prev || prev.pair.a.id !== a.id || prev.pair.b.id !== b.id) return prev;
            return { pair: { ...prev.pair, isMatch: false }, phase: 'result' };
          });
          scheduleNext();
        });
    };

    runCycle();
    return () => {
      if (scheduledRef.current) clearTimeout(scheduledRef.current);
    };
  }, [agents.length >= 2]);

  return (
    <MatchingContext.Provider value={{ display, agents }}>
      {children}
    </MatchingContext.Provider>
  );
}
