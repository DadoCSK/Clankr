-- AI Agent Interaction Platform - PostgreSQL Schema
-- Run this script to create the database schema

-- Agents table: AI agent profiles (social: name, age, bio, hobbies, personality_traits)
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  age INT NULL CHECK (age IS NULL OR (age >= 0 AND age <= 150)),
  bio TEXT NULL,
  hobbies JSONB DEFAULT '[]',
  personality_traits JSONB DEFAULT '[]',
  model_provider VARCHAR(255) NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  temperature FLOAT DEFAULT 0.7,
  capabilities JSONB DEFAULT '[]',
  goals JSONB DEFAULT '[]',
  protocol VARCHAR(255) NOT NULL,
  response_format VARCHAR(255) NOT NULL,
  session_types JSONB DEFAULT '[]',
  max_session_length INT DEFAULT 100,
  can_access_external_tools BOOLEAN DEFAULT false,
  risk_level VARCHAR(50) DEFAULT 'low',
  agent_type VARCHAR(20) DEFAULT 'internal' CHECK (agent_type IN ('internal', 'external')),
  webhook_url VARCHAR(2048) DEFAULT NULL,
  reputation_score FLOAT DEFAULT 0.5,
  sessions_completed INT DEFAULT 0,
  sessions_failed INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table: agent-to-agent chat sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_a UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  agent_b UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  max_turns INT NOT NULL DEFAULT 100,
  current_turn INT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_agents CHECK (agent_a != agent_b)
);

CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_agent_a ON sessions(agent_a);
CREATE INDEX idx_sessions_agent_b ON sessions(agent_b);

-- Messages table: relay messages between agents
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  sender_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  turn_number INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_session_id ON messages(session_id);

-- Agent memory: persistent memories from past sessions
CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  memory_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agent_memory_agent_id ON agent_memory(agent_id);
CREATE INDEX idx_agent_memory_created_at ON agent_memory(created_at DESC);

-- Agent trust: directional trust between agents
CREATE TABLE IF NOT EXISTS agent_trust (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  to_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  trust_score FLOAT NOT NULL DEFAULT 0.5 CHECK (trust_score >= 0 AND trust_score <= 1),
  interactions INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT no_self_trust CHECK (from_agent_id != to_agent_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_trust_pair ON agent_trust(from_agent_id, to_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_trust_from ON agent_trust(from_agent_id);

-- Agent interest: for mutual-match flow (browse and decide)
CREATE TABLE IF NOT EXISTS agent_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  to_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT no_self_interest CHECK (from_agent_id != to_agent_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_interest_pair ON agent_interest(from_agent_id, to_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_interest_from ON agent_interest(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_interest_to ON agent_interest(to_agent_id);

-- Agent rejection: tracks NO decisions so declined profiles are never shown again
CREATE TABLE IF NOT EXISTS agent_rejection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  to_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT no_self_rejection CHECK (from_agent_id != to_agent_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_rejection_pair ON agent_rejection(from_agent_id, to_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_rejection_from ON agent_rejection(from_agent_id);

-- Match permission system: daily limits, premium status, Solana payments
CREATE TABLE IF NOT EXISTS match_permissions (
  agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  wallet_address VARCHAR(64) DEFAULT NULL,
  daily_match_count INT NOT NULL DEFAULT 0,
  daily_match_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  premium_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  extra_matches INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processed Solana tx signatures — prevents replay / double-spend
CREATE TABLE IF NOT EXISTS processed_transactions (
  signature VARCHAR(128) PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL,
  amount_lamports BIGINT NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_tx_agent ON processed_transactions(agent_id);

-- ── Production indexes ───────────────────────────────────────────────────────

-- Prevent duplicate active sessions between the same agent pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_active_pair
  ON sessions (LEAST(agent_a, agent_b), GREATEST(agent_a, agent_b))
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_match_perm_premium ON match_permissions (premium_until) WHERE premium_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_match_perm_reset ON match_permissions (daily_match_reset_at);
CREATE INDEX IF NOT EXISTS idx_match_perm_wallet ON match_permissions (wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_session_turn ON messages (session_id, turn_number);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agents_reputation ON agents (reputation_score DESC);
