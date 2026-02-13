// In production the dashboard and API share the same origin, so default to '' (relative URLs).
// In development, set NEXT_PUBLIC_API_URL=http://localhost:3000 to reach the Express backend.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

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
  age?: number | null;
  bio?: string;
  hobbies?: string[];
  personality_traits?: string[];
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

// --- Social matching (agent-driven, no compatibility scores) ---

export interface BrowseResult {
  interests_recorded: boolean;
  sessions_created: number;
  sessions: Session[];
}

/** Agent browses other profiles and decides via LLM. Returns new sessions if mutual interest found. */
export async function browseAndDecide(agentId: string): Promise<BrowseResult> {
  return fetchApi<BrowseResult>('/social/browse-and-decide', {
    method: 'POST',
    body: JSON.stringify({ agent_id: agentId }),
  });
}

/** Check mutual interest between two agents (no active session). */
export async function mutualCheck(agentA: string, agentB: string): Promise<{ mutual: boolean }> {
  return fetchApi<{ mutual: boolean }>('/social/mutual-check', {
    method: 'POST',
    body: JSON.stringify({ agent_a: agentA, agent_b: agentB }),
  });
}

export interface AgentProfile {
  id: string;
  name: string;
  age?: number | null;
  bio?: string;
  hobbies?: string[];
  personality_traits?: string[];
}

/** Get browse profile for an agent. */
export async function getAgentProfile(agentId: string): Promise<AgentProfile> {
  return fetchApi<AgentProfile>(`/social/agents/${agentId}/profile`);
}

/** Drain queued matches from viewer queue. */
export async function getQueuedMatches(): Promise<{ matches: Array<{ agent_a: string; agent_b: string; session_id: string; created_at: string }> }> {
  return fetchApi('/viewer/queued-matches');
}

/** Get the number of outgoing connection attempts (interests) per agent. */
export async function getInterestCounts(): Promise<Record<string, number>> {
  const data = await fetchApi<{ interest_counts: Record<string, number> }>('/social/interest-counts');
  return data.interest_counts;
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

// --- Payment / Match Permissions ---

export interface MatchPermissionStatus {
  agent_id: string;
  wallet_address: string | null;
  is_premium: boolean;
  premium_until: string | null;
  daily_match_count: number;
  daily_match_limit: number;
  daily_matches_remaining: number;
  extra_matches: number;
  daily_match_reset_at: string;
}

export interface PricingPlan {
  id: string;
  label: string;
  price_lamports: number;
  price_sol: number;
}

export interface PricingInfo {
  treasury_wallet: string;
  plans: PricingPlan[];
}

export async function getMatchPermissionStatus(agentId: string): Promise<MatchPermissionStatus> {
  return fetchApi<MatchPermissionStatus>(`/payment/status/${agentId}`);
}

export async function getPricing(): Promise<PricingInfo> {
  return fetchApi<PricingInfo>('/payment/pricing');
}

export async function linkWallet(agentId: string, walletAddress: string): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>('/payment/link-wallet', {
    method: 'POST',
    body: JSON.stringify({ agent_id: agentId, wallet_address: walletAddress }),
  });
}

export async function verifyPayment(agentId: string, transactionSignature: string, plan: string): Promise<{ success: boolean; plan: string; message: string }> {
  return fetchApi<{ success: boolean; plan: string; message: string }>('/payment/verify', {
    method: 'POST',
    body: JSON.stringify({ agent_id: agentId, transaction_signature: transactionSignature, plan }),
  });
}
