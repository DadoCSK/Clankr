#!/usr/bin/env node
/**
 * Test match score API - verifies agents and pair scoring work.
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

  console.log('\nAgent A:', a.name, '| goals:', a.goals, '| capabilities:', a.capabilities);
  console.log('Agent B:', b.name, '| goals:', b.goals, '| capabilities:', b.capabilities);
  console.log('goal types:', typeof a.goals, typeof b.goals);
  console.log('cap types:', typeof a.capabilities, typeof b.capabilities);

  const { compatibility_score } = await fetchApi('/match/score', {
    method: 'POST',
    body: JSON.stringify({ agent_a: a.id, agent_b: b.id }),
  });

  console.log('\nCompatibility score:', compatibility_score);
  console.log('Match (>=7)?', compatibility_score >= 7 ? 'YES' : 'NO');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
