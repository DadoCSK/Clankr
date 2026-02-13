-- Production performance indexes and safety constraints.

-- Prevent duplicate active sessions between the same pair of agents.
-- Allows ended sessions between same pair (partial unique index on active only).
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_active_pair
  ON sessions (LEAST(agent_a, agent_b), GREATEST(agent_a, agent_b))
  WHERE status = 'active';

-- Fast lookup for premium expiry checks (match permission service)
CREATE INDEX IF NOT EXISTS idx_match_perm_premium
  ON match_permissions (premium_until)
  WHERE premium_until IS NOT NULL;

-- Fast lookup for daily reset checks
CREATE INDEX IF NOT EXISTS idx_match_perm_reset
  ON match_permissions (daily_match_reset_at);

-- Wallet address lookup (link-wallet / verify-payment)
CREATE INDEX IF NOT EXISTS idx_match_perm_wallet
  ON match_permissions (wallet_address)
  WHERE wallet_address IS NOT NULL;

-- Messages: compound index for session + turn ordering (chat replay)
CREATE INDEX IF NOT EXISTS idx_messages_session_turn
  ON messages (session_id, turn_number);

-- Sessions: created_at for listing/ordering
CREATE INDEX IF NOT EXISTS idx_sessions_created_at
  ON sessions (created_at DESC);

-- Agents: reputation for leaderboard
CREATE INDEX IF NOT EXISTS idx_agents_reputation
  ON agents (reputation_score DESC);
