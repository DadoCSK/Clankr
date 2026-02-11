#!/usr/bin/env node
/**
 * Test external agent flow: spins up a mock webhook server, registers
 * an external agent, runs a session with an internal agent, logs conversation.
 *
 * Usage: node scripts/testExternalAgent.js
 * Prereq: API running (npm run dev)
 */

require('dotenv').config();
const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const WEBHOOK_PORT = 3456;
const WEBHOOK_URL = `http://localhost:${WEBHOOK_PORT}/webhook`;

const messages = [];

const webhookServer = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.writeHead(404);
    res.end();
    return;
  }

  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const history = data.conversation_history || [];
      const turn = history.length + 1;

      let reply;
      if (history.length === 0) {
        reply = 'Hello! I am an external agent. Ready to collaborate.';
      } else {
        const last = history[history.length - 1];
        reply = `I received: "${last.content?.slice(0, 50)}...". Here is my response for turn ${turn}.`;
      }

      messages.push({ role: 'external', content: reply });
      console.log(`  [Webhook] received ${history.length} messages → replied: "${reply.slice(0, 60)}..."`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ response: reply }));
    } catch (e) {
      console.error('  [Webhook] error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
  });
});

async function fetchApi(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log('=== External Agent Test ===\n');

  webhookServer.listen(WEBHOOK_PORT, () => {
    console.log(`Mock webhook server on ${WEBHOOK_URL}\n`);
  });

  await new Promise((r) => setTimeout(r, 300));

  try {
    await fetchApi('/health');
  } catch (e) {
    console.error('API not reachable. Start with: npm run dev');
    process.exit(1);
  }

  console.log('1. Register external agent (webhook)');
  const { agent_id: externalId } = await fetchApi('/agents/register', {
    method: 'POST',
  body: JSON.stringify({
    name: 'ExternalBot',
    description: 'Agent running via webhook',
    model_provider: 'webhook',
    model_name: 'external',
    agent_type: 'external',
    webhook_url: WEBHOOK_URL,
    protocol: 'http',
    response_format: 'json',
    capabilities: ['webhook'],
    goals: ['collaborate_with_agents'],
    max_session_length: 10,
  }),
  });
  console.log(`   → ${externalId}\n`);

  console.log('2. Register internal agent (local)');
  const { agent_id: internalId } = await fetchApi('/agents/register', {
    method: 'POST',
  body: JSON.stringify({
    name: 'LocalPartner',
    description: 'Local test agent',
    model_provider: 'local',
    model_name: 'mock',
    protocol: 'http',
    response_format: 'text',
    capabilities: ['testing'],
    goals: ['collaborate_with_agents'],
    max_session_length: 10,
  }),
  });
  console.log(`   → ${internalId}\n`);

  console.log('3. Start session & run');
  const { session_id } = await fetchApi('/sessions/start', {
    method: 'POST',
    body: JSON.stringify({ agent_a: internalId, agent_b: externalId }),
  });

  const run = await fetchApi(`/sessions/${session_id}/run?wait=1`, { method: 'POST' });

  console.log(`\n4. Conversation (${run.turns_completed} turns):`);
  run.messages.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.content}`);
  });

  console.log('\nDone.');
  webhookServer.close();
}

main().catch((e) => {
  console.error(e);
  webhookServer.close();
  process.exit(1);
});
