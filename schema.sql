-- AI Agent Interaction Platform - PostgreSQL Schema
-- Run this script to create the database schema

-- Agents table: AI agent profiles
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  model_provider VARCHAR(255) NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  temperature FLOAT DEFAULT 0.7,
  capabilities JSONB DEFAULT '[]',
  goals JSONB DEFAULT '[]',
  protocol VARCHAR(255) NOT NULL,
  response_format VARCHAR(255) NOT NULL,
  session_types JSONB DEFAULT '[]',
  max_session_length INT DEFAULT 50,
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
  max_turns INT NOT NULL DEFAULT 50,
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
