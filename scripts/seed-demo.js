#!/usr/bin/env node
/**
 * Register 10 casual agents with random attributes — they randomly match.
 * Usage: node scripts/seed-demo.js
 */

require('dotenv').config();
const baseUrl = process.env.API_URL || 'http://localhost:3000';

async function fetchApi(path, opts = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

const GOALS = [
  'assist_users', 'collaborate', 'learn', 'create', 'automate', 'analyze', 'design', 'optimize',
  'explore', 'innovate', 'educate', 'streamline', 'improve_productivity', 'creative_collaboration',
  'data_driven_decisions', 'knowledge_sharing', 'problem_solving', 'user_experience',
];
const CAPABILITIES = [
  'reasoning', 'planning', 'writing', 'coding', 'design', 'analysis', 'research', 'creativity',
  'automation', 'synthesis', 'editing', 'documentation', 'visualization', 'prototyping',
  'task_decomposition', 'brainstorming', 'critical_thinking', 'communication',
];
const NAMES = ['Pixel', 'Nova', 'Echo', 'Blaze', 'Muse', 'Zen', 'Cipher', 'Aria', 'Vex', 'Luna'];
const DESCRIPTIONS = [
  'You help with creative tasks.', 'You assist with research.', 'You enjoy brainstorming ideas.',
  'You like building things.', 'You focus on optimization.', 'You explore new possibilities.',
  'You support collaboration.', 'You design solutions.', 'You analyze and advise.',
  'You learn and adapt.',
];
const RISK_LEVELS = ['low', 'medium'];

const agents = [];
for (let i = 0; i < 10; i++) {
  const goals = pickRandom(GOALS, 4 + Math.floor(Math.random() * 4));
  const capabilities = pickRandom(CAPABILITIES, 4 + Math.floor(Math.random() * 4));
  agents.push({
    name: NAMES[i],
    description: DESCRIPTIONS[i],
    model_provider: 'gemini',
    model_name: 'gemini-2.0-flash-lite',
    temperature: 0.2 + Math.random() * 0.6,
    capabilities,
    goals,
    protocol: 'http',
    response_format: 'json',
    session_types: ['collaborative'],
    max_session_length: 8 + Math.floor(Math.random() * 6),
    risk_level: RISK_LEVELS[Math.floor(Math.random() * RISK_LEVELS.length)],
  });
}

async function main() {
  console.log('🌐 API:', baseUrl);
  try {
    await fetchApi('/health');
  } catch (e) {
    console.error('API not reachable. Is the server running? npm run dev');
    process.exit(1);
  }

  console.log('\n--- Register 10 casual agents with random goals & capabilities ---\n');
  for (const a of agents) {
    const { agent_id } = await fetchApi('/agents/register', {
      method: 'POST',
      body: JSON.stringify(a),
    });
    console.log(`  ✓ ${a.name} → ${agent_id} [${a.goals.join(', ')} | ${a.capabilities.join(', ')}]`);
  }
  console.log('\nDone. Agents will randomly match based on shared goals/capabilities.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
