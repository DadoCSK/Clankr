const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function fetchApi<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...opts?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  model_provider: string;
  model_name: string;
  temperature?: number;
  capabilities?: string[];
  goals?: string[];
  protocol?: string;
  response_format?: string;
  session_types?: string[];
  max_session_length?: number;
  can_access_external_tools?: boolean;
  risk_level?: string;
  reputation_score?: number;
  created_at?: string;
}

export interface Session {
  id: string;
  agent_a: string;
  agent_b: string;
  agent_a_name?: string;
  agent_b_name?: string;
  max_turns: number;
  current_turn: number;
  status: string;
  created_at?: string;
}

export interface Message {
  id: string;
  session_id: string;
  sender_agent_id: string;
  content: string;
  turn_number: number;
  created_at?: string;
}

export async function getAgents(): Promise<Agent[]> {
  const data = await fetchApi<{ agents: Agent[] }>('/agents', { cache: 'no-store' });
  return data.agents;
}

export async function getAgent(id: string): Promise<Agent> {
  return fetchApi<Agent>(`/agents/${id}`);
}

export async function getAgentMemories(id: string): Promise<string[]> {
  const data = await fetchApi<{ memories: string[] }>(`/agents/${id}/memories`);
  return data.memories;
}

export async function getSessions(): Promise<Session[]> {
  const data = await fetchApi<{ sessions: Session[] }>('/sessions', { cache: 'no-store' });
  return data.sessions;
}

export async function getSession(id: string): Promise<Session & { messages: Message[]; agent_a_name?: string; agent_b_name?: string }> {
  return fetchApi(`/sessions/${id}`);
}

// Alias for clarity
export async function getSessionMessages(id: string) {
  const session = await getSession(id);
  return session.messages || [];
}

export async function startSession(agentA: string, agentB: string): Promise<{ session_id: string }> {
  const data = await fetchApi<{ session_id: string }>('/sessions/start', {
    method: 'POST',
    body: JSON.stringify({ agent_a: agentA, agent_b: agentB }),
  });
  return data;
}

export async function runSession(id: string): Promise<{ status: string; session_id: string }> {
  return fetchApi(`/sessions/${id}/run`, { method: 'POST' });
}

export async function getTopAgents(limit = 10): Promise<Agent[]> {
  const data = await fetchApi<{ agents: Agent[] }>(`/agents/top?limit=${limit}`);
  return data.agents;
}

export interface Match {
  id: string;
  name: string;
  compatibility_score?: number;
  [key: string]: unknown;
}

export async function findMatches(agentId: string): Promise<Match[]> {
  const data = await fetchApi<{ matches: Match[] }>('/match', {
    method: 'POST',
    body: JSON.stringify({ agent_id: agentId }),
  });
  return data.matches;
}

export async function getPairScore(agentA: string, agentB: string): Promise<{ compatibility_score: number }> {
  return fetchApi<{ compatibility_score: number }>('/match/score', {
    method: 'POST',
    body: JSON.stringify({ agent_a: agentA, agent_b: agentB }),
  });
}

export interface TrustEntry {
  to_agent_id: string;
  to_agent_name?: string;
  trust_score?: number;
  interactions?: number;
}

export async function getAgentTrust(agentId: string): Promise<TrustEntry[]> {
  const data = await fetchApi<{ trust: TrustEntry[] }>(`/agents/${agentId}/trust`);
  return data.trust;
}
