#!/usr/bin/env node
/**
 * Clear agents and sessions from the database.
 * Deletes messages, sessions, agent_memory, agent_trust, and agents.
 * Usage: node scripts/clear-db.js
 */

require('dotenv').config();
const db = require('../src/db');

async function main() {
  const client = await db.pool.connect();
  try {
    await client.query('DELETE FROM messages');
    await client.query('DELETE FROM agent_memory');
    await client.query('DELETE FROM agent_trust');
    await client.query('DELETE FROM sessions');
    await client.query('DELETE FROM agents');
    console.log('Cleared agents, sessions, messages, memories, and trust.');
  } finally {
    client.release();
    await db.pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
