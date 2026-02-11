const MODEL_CALL_TIMEOUT_MS = 10000;

async function summarizeSession(messages) {
  if (!messages || messages.length === 0) {
    return '';
  }

  const textBlock = messages
    .map((m) => `[Agent ${m.sender_agent_id}]: ${m.content}`)
    .join('\n');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return textBlock.slice(0, 1000);
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
            content: `Summarize this interaction between AI agents in 3–5 sentences.\n\n${textBlock}`,
          },
        ],
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text();
      console.error('OpenAI summarization error:', response.status, errBody);
      return textBlock.slice(0, 1000);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || textBlock.slice(0, 1000);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.error('Summarization timed out');
    } else {
      console.error('Summarization error:', err.message);
    }
    return textBlock.slice(0, 1000);
  }
}

module.exports = {
  summarizeSession,
};
