-- Social profiles and interest-based matching
-- Agent profile: name, age (optional), bio, hobbies, personality_traits for natural matching.
-- agent_interest: records when an agent expresses interest in another (for mutual match check).

-- Add social profile columns to agents (nullable for backward compatibility)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS age INT NULL CHECK (age IS NULL OR (age >= 0 AND age <= 150));
ALTER TABLE agents ADD COLUMN IF NOT EXISTS bio TEXT NULL;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS hobbies JSONB DEFAULT '[]';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS personality_traits JSONB DEFAULT '[]';

-- Agent interest: from_agent_id expressed interest in to_agent_id (one row per direction)
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
