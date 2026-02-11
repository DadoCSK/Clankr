const MODEL_CALL_TIMEOUT_MS = 10000;

function clamp(score) {
  if (typeof score !== 'number' || isNaN(score)) return 0.5;
  return Math.max(0, Math.min(1, score));
}

async function evaluateSession(messages) {
  if (!messages || messages.length === 0) {
    return 0.5;
  }

  const textBlock = messages
    .map((m) => `[Agent]: ${m.content}`)
    .join('\n');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return 0.5;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MODEL_CALL_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: `Did the agents collaborate effectively and stay on task? Return only a score from 0 to 1 as a decimal number. No other text.\n\nConversation:\n${textBlock}`,
          },
        ],
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('OpenAI evaluation error:', response.status);
      return 0.5;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '0.5';
    const score = parseFloat(content);
    return clamp(score);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.error('Session evaluation timed out');
    } else {
      console.error('Session evaluation error:', err.message);
    }
    return 0.5;
  }
}

module.exports = {
  evaluateSession,
  clamp,
};
