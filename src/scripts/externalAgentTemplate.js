#!/usr/bin/env node
/**
 * External Agent Template - Runnable server for real external agents.
 *
 * Uses Google Gemini. Receives webhook calls from the platform, calls Gemini,
 * and returns generated responses.
 *
 * Usage:
 *   1. Set GEMINI_API_KEY in .env (get from https://aistudio.google.com/apikey)
 *   2. node src/scripts/externalAgentTemplate.js
 *   3. Expose via ngrok: ngrok http 3457
 *   4. Register on platform: agent_type="external", webhook_url="https://xxx.ngrok.io/respond"
 *   5. Start session, POST /sessions/:id/run
 *
 * Endpoint: POST /respond
 * Payload: { conversation_history, agent_profile, session_id, past_memories }
 * Response: { response: "agent reply text" }
 */

const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });
const express = require('express');

const PORT = process.env.EXTERNAL_AGENT_PORT || 3457;
const DEFAULT_MODEL = 'gemini-2.0-flash-lite';
const app = express();

app.use(express.json({ limit: '100kb' }));

app.post('/respond', async (req, res) => {
  const { conversation_history = [], agent_profile = {}, session_id, past_memories = [] } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Template] GEMINI_API_KEY not set, cwd=', process.cwd());
    return res.status(500).json({ response: '', error: 'GEMINI_API_KEY not set' });
  }

  const systemContent = [
    agent_profile.description || `You are ${agent_profile.name}.`,
    past_memories.length ? `\nPast memories:\n${past_memories.join('\n')}` : '',
  ].filter(Boolean).join('');

  const contents = conversation_history.map((m) => ({
    role: 'user',
    parts: [{ text: `[${m.sender_agent_id}]: ${m.content}` }],
  }));

  const model = agent_profile.model_name || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemContent }] },
        contents: contents.length ? contents : [{ role: 'user', parts: [{ text: 'Hello. Please introduce yourself briefly.' }] }],
        generationConfig: {
          temperature: agent_profile.temperature ?? 0.7,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || JSON.stringify(data);
      console.error('[Template] Gemini error:', response.status, 'url=', url.split('?')[0], 'err=', errMsg);
      return res.status(502).json({ response: '', error: `Model error: ${response.status}` });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const content = (text || '').trim();

    res.json({ response: content });
  } catch (err) {
    console.error('[Template] Error:', err.message);
    res.status(500).json({ response: '', error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`External Agent Template (Gemini) on http://localhost:${PORT}`);
  console.log(`  POST /respond - receive platform webhook`);
  console.log(`  Register with webhook_url: http://localhost:${PORT}/respond`);
  console.log(`  For public access, use ngrok: ngrok http ${PORT}`);
});
