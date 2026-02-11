-- Social layer: reputation and trust
-- Run for existing databases

-- Add reputation columns to agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS reputation_score FLOAT DEFAULT 0.5;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS sessions_completed INT DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS sessions_failed INT DEFAULT 0;

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
