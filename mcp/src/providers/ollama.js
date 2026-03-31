/**
 * Ollama provider — OpenAI-compatible API (v1/chat/completions)
 */

const ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
const MODEL    = process.env.OLLAMA_MODEL    || 'mistral:latest';

export async function isAvailable() {
  try {
    const res = await fetch(`${ENDPOINT}/api/tags`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function chat(messages, opts = {}) {
  const res = await fetch(`${ENDPOINT}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(opts.timeout || 90000),
    body: JSON.stringify({
      model: opts.model || MODEL,
      messages,
      max_tokens: opts.maxTokens || 600,
      temperature: opts.temperature ?? 0.3,
      stream: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    model: data.model || MODEL,
    provider: 'ollama',
    usage: data.usage || null,
  };
}

export async function listModels() {
  const res = await fetch(`${ENDPOINT}/api/tags`, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.models || []).map(m => ({
    id: m.name,
    provider: 'ollama',
    size: m.size,
    family: m.details?.family || 'unknown',
  }));
}

export const info = { name: 'Ollama', endpoint: ENDPOINT, model: MODEL };
