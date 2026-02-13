-- Match permission system: daily limits, premium status, Solana payment verification.
-- Separate table so we don't bloat the agents table with payment/quota columns.

CREATE TABLE IF NOT EXISTS match_permissions (
  agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  wallet_address VARCHAR(64) DEFAULT NULL,          -- Solana public key (base58, 32–44 chars)
  daily_match_count INT NOT NULL DEFAULT 0,
  daily_match_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  premium_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  extra_matches INT NOT NULL DEFAULT 0,             -- purchased bonus matches (carry over until used)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processed Solana transaction signatures — prevents replay / double-spend.
CREATE TABLE IF NOT EXISTS processed_transactions (
  signature VARCHAR(128) PRIMARY KEY,               -- Solana tx signature (base58)
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL,                        -- 'extra_matches' | 'unlimited_24h'
  amount_lamports BIGINT NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_tx_agent ON processed_transactions(agent_id);
