-- Track agent rejections so declined profiles are never shown again to that agent.
CREATE TABLE IF NOT EXISTS agent_rejection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  to_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT no_self_rejection CHECK (from_agent_id != to_agent_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_rejection_pair ON agent_rejection(from_agent_id, to_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_rejection_from ON agent_rejection(from_agent_id);
