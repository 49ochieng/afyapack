/**
 * Model router — picks best available local provider.
 * Priority: Foundry Local → Ollama → error
 */
import * as foundry from './foundry.js';
import * as ollama from './ollama.js';

let _provider = null;

export async function detectProviders() {
  const [hasFoundry, hasOllama] = await Promise.all([
    foundry.isAvailable(),
    ollama.isAvailable(),
  ]);

  return {
    foundry: hasFoundry,
    ollama: hasOllama,
    preferred: hasFoundry ? 'foundry' : hasOllama ? 'ollama' : null,
    foundry_model: foundry.info.model,
    ollama_model: ollama.info.model,
  };
}

/**
 * Route a chat request to the specified or best available provider.
 * @param {Array} messages - OpenAI message format
 * @param {Object} opts - { provider: 'foundry'|'ollama'|'auto', maxTokens, temperature, timeout }
 */
export async function chat(messages, opts = {}) {
  const target = opts.provider || 'auto';

  if (target === 'foundry' || target === 'auto') {
    if (await foundry.isAvailable()) {
      return foundry.chat(messages, opts);
    }
    if (target === 'foundry') throw new Error('Foundry Local is not available');
  }

  if (target === 'ollama' || target === 'auto') {
    if (await ollama.isAvailable()) {
      return ollama.chat(messages, opts);
    }
    if (target === 'ollama') throw new Error('Ollama is not available');
  }

  throw new Error('No local AI provider available. Start Foundry Local or Ollama first.');
}

export async function listAllModels() {
  const results = [];

  try {
    const fm = await foundry.listModels();
    results.push(...fm);
  } catch { /* not available */ }

  try {
    const om = await ollama.listModels();
    results.push(...om);
  } catch { /* not available */ }

  return results;
}
