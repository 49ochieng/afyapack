/**
 * Foundry Local provider — OpenAI-compatible API
 */

const ENDPOINT = process.env.FOUNDRY_ENDPOINT || 'http://127.0.0.1:54346';
const MODEL    = process.env.FOUNDRY_MODEL    || 'qwen2.5-0.5b-instruct-generic-cpu:4';

export async function isAvailable() {
  try {
    const res = await fetch(`${ENDPOINT}/v1/models`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function chat(messages, opts = {}) {
  const res = await fetch(`${ENDPOINT}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(opts.timeout || 60000),
    body: JSON.stringify({
      model: opts.model || MODEL,
      messages,
      max_tokens: opts.maxTokens || 600,
      temperature: opts.temperature ?? 0.3,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Foundry error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    model: data.model || MODEL,
    provider: 'foundry',
    usage: data.usage || null,
  };
}

export async function listModels() {
  const res = await fetch(`${ENDPOINT}/v1/models`, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.data || []).map(m => ({
    id: m.id,
    provider: 'foundry',
    toolCalling: m.toolCalling || false,
    maxTokens: m.maxInputTokens || 4096,
  }));
}

export const info = { name: 'Foundry Local', endpoint: ENDPOINT, model: MODEL };
