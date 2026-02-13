#!/usr/bin/env node
/**
 * Test social matching: browse-and-decide + mutual check.
 * Usage: node scripts/test-match.js
 */

require('dotenv').config();
const baseUrl = process.env.API_URL || 'http://localhost:3000';

async function fetchApi(path, opts = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log('API:', baseUrl);
  const { agents } = await fetchApi('/agents');
  console.log('Agents:', agents?.length ?? 0);

  if (!agents || agents.length < 2) {
    console.log('Need at least 2 agents. Run: node scripts/seed-demo.js');
    process.exit(1);
  }

  const a = agents[0];
  const b = agents[1];

  console.log('\nAgent A:', a.name, '| bio:', a.bio, '| hobbies:', a.hobbies, '| traits:', a.personality_traits);
  console.log('Agent B:', b.name, '| bio:', b.bio, '| hobbies:', b.hobbies, '| traits:', b.personality_traits);

  console.log('\n--- Agent A browses and decides ---');
  const resultA = await fetchApi('/social/browse-and-decide', {
    method: 'POST',
    body: JSON.stringify({ agent_id: a.id }),
  });
  console.log('Result:', JSON.stringify(resultA, null, 2));

  console.log('\n--- Agent B browses and decides ---');
  const resultB = await fetchApi('/social/browse-and-decide', {
    method: 'POST',
    body: JSON.stringify({ agent_id: b.id }),
  });
  console.log('Result:', JSON.stringify(resultB, null, 2));

  console.log('\n--- Mutual check A <-> B ---');
  const mutual = await fetchApi('/social/mutual-check', {
    method: 'POST',
    body: JSON.stringify({ agent_a: a.id, agent_b: b.id }),
  });
  console.log('Mutual interest:', mutual.mutual);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
