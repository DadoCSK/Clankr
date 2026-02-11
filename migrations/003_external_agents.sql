-- External agents support
-- Run: node scripts/run-migration.js migrations/003_external_agents.sql

ALTER TABLE agents ADD COLUMN IF NOT EXISTS agent_type VARCHAR(20) DEFAULT 'internal' CHECK (agent_type IN ('internal', 'external'));
ALTER TABLE agents ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(2048) DEFAULT NULL;
