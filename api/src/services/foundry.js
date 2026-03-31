/**
 * AfyaPack local AI service.
 *
 * Priority order:
 *   1. Foundry Local  (qwen2.5-0.5b at http://127.0.0.1:54346)
 *   2. Ollama         (mistral at http://localhost:11434)
 *   3. Mock mode      (template responses — retrieval still active)
 */

require('dotenv').config();

const FOUNDRY_ENDPOINT = process.env.FOUNDRY_ENDPOINT || 'http://127.0.0.1:54346';
const FOUNDRY_MODEL    = process.env.FOUNDRY_MODEL    || 'qwen2.5-0.5b-instruct-generic-cpu:4';
const OLLAMA_ENDPOINT  = process.env.OLLAMA_ENDPOINT  || 'http://localhost:11434';
const OLLAMA_MODEL     = process.env.OLLAMA_MODEL     || 'mistral:latest';
const OPENAI_API_KEY   = process.env.OPENAI_API_KEY   || null;
const OPENAI_MODEL     = process.env.OPENAI_MODEL     || 'gpt-4o-mini';

let activeProvider  = null; // 'foundry' | 'ollama' | 'openai' | 'mock'
let activeModel     = null;
let ollamaAvailable = false;

// ─── Provider: Foundry Local ─────────────────────────────────────────────────

async function tryFoundry() {
  try {
    const res = await fetchWithTimeout(
      `${FOUNDRY_ENDPOINT}/v1/chat/completions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: FOUNDRY_MODEL,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5,
        }),
      },
      15000,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await res.json();
    return true;
  } catch {
    return false;
  }
}

async function callFoundry(messages, opts = {}) {
  const res = await fetchWithTimeout(
    `${FOUNDRY_ENDPOINT}/v1/chat/completions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: FOUNDRY_MODEL,
        messages,
        max_tokens: opts.maxTokens || 700,
        temperature: opts.temperature ?? 0.3,
      }),
    },
    60000,
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Foundry error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── Provider: Ollama ────────────────────────────────────────────────────────

async function tryOllama() {
  try {
    // Use /api/tags (instant — no model loading) to detect Ollama presence
    const res = await fetchWithTimeout(`${OLLAMA_ENDPOINT}/api/tags`, {}, 5000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const models = data.models || [];
    const found = models.some(m => m.name === OLLAMA_MODEL || m.model === OLLAMA_MODEL);
    if (!found) throw new Error(`Model ${OLLAMA_MODEL} not installed`);
    return true;
  } catch {
    return false;
  }
}

async function callOllama(messages, opts = {}) {
  const res = await fetchWithTimeout(
    `${OLLAMA_ENDPOINT}/v1/chat/completions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        max_tokens: opts.maxTokens || 700,
        temperature: opts.temperature ?? 0.3,
      }),
    },
    300000, // mistral:7B on CPU can take 2-3 min for full clinical responses
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── Provider: Mock ──────────────────────────────────────────────────────────

function callMock(messages) {
  const userMsg = messages.find(m => m.role === 'user')?.content || '';
  const hasFever = /fever|homa|joto/i.test(userMsg);
  const hasPregnancy = /pregnant|mimba|maternal/i.test(userMsg);
  const isSwahili = /homa|mgonjwa|dawa|dalili/i.test(userMsg);

  if (isSwahili) {
    return `**Mwongozo wa Itifaki za Kliniki**

Kulingana na itifaki zilizohifadhiwa mahali, mwongozo ufuatao unatumika:

**Muhtasari wa Tathmini**
Dalili zilizowasilishwa zinahitaji tathmini ya kliniki makini.${hasFever ? '\n\n**Homa:** Toa dawa ya kupunguza joto (paracetamol) kwa kipimo sahihi. Angalia kwa malaria.' : ''}${hasPregnancy ? '\n\n**Mimba:** Tathmini ya uzazi inahitajika mara moja.' : ''}

**Hatua Zinazopendekezwa**
1. Fanya tathmini kamili ya msingi
2. Fuatilia alama muhimu kwa vipindi vya kawaida
3. Hakikisha maji ya kutosha

**Onyo la Usalama**
⚠️ Hii ni msaada wa uamuzi wa kliniki tu. Haitoi utambuzi. Rejesha wakati una shaka.

---
*[Hali ya maonyesho — unganisha Foundry Local au Ollama kwa mwongozo wa AI halisi]*`;
  }

  return `**Clinical Guidance (Protocol-Based)**

Based on retrieved local protocols:

**Assessment Summary**
The presented symptoms require careful clinical evaluation.${hasFever ? '\n\n**Fever management:** Give paracetamol per weight-based dosing. Test for malaria.' : ''}${hasPregnancy ? '\n\n**Pregnancy:** Obstetric assessment required urgently.' : ''}

**Recommended Actions**
1. Complete primary assessment
2. Monitor vital signs at regular intervals
3. Ensure adequate hydration

**Safety Note**
⚠️ Protocol-based decision support only. Does not diagnose. Refer when uncertain.

---
*[Demo mode — connect Foundry Local or Ollama for real AI guidance]*`;
}

// ─── Provider: OpenAI (cloud fallback) ──────────────────────────────────────

async function callOpenAI(messages, opts = {}) {
  const { OpenAI } = require('openai');
  const client = new OpenAI({ apiKey: OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages,
    max_tokens: opts.maxTokens || 400,
    temperature: opts.temperature ?? 0.25,
  });
  return response.choices?.[0]?.message?.content || '';
}

// ─── Utility ─────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── Initialization ───────────────────────────────────────────────────────────

async function initFoundry() {
  console.log('[AI] Detecting local models...');

  const [foundryOk, ollamaOk] = await Promise.all([tryFoundry(), tryOllama()]);

  if (foundryOk) {
    activeProvider = 'foundry';
    activeModel = FOUNDRY_MODEL;
    ollamaAvailable = ollamaOk;
    console.log(`[AI] Foundry Local ready → ${FOUNDRY_MODEL}${ollamaOk ? ' (Ollama also available)' : ''}`);
    return;
  }

  if (ollamaOk) {
    activeProvider = 'ollama';
    activeModel = OLLAMA_MODEL;
    ollamaAvailable = true;
    console.log(`[AI] Ollama ready → ${OLLAMA_MODEL}`);
    return;
  }

  if (OPENAI_API_KEY) {
    activeProvider = 'openai';
    activeModel = OPENAI_MODEL;
    console.log(`[AI] OpenAI cloud ready → ${OPENAI_MODEL}`);
    return;
  }

  console.log('[AI] No model reachable — running in mock mode');
  activeProvider = 'mock';
  activeModel = null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function chat(messages, opts = {}) {
  // Swahili queries: route to Ollama (mistral) when available — it handles
  // Swahili far better than qwen2.5-0.5b. English stays on Foundry (fast).
  const isSwahili = opts.lang === 'sw';

  try {
    if (activeProvider === 'foundry') return await callFoundry(messages, opts);
    if (activeProvider === 'ollama') return await callOllama(messages, opts);
    if (activeProvider === 'openai') return await callOpenAI(messages, opts);
  } catch (err) {
    console.error(`[AI] call failed:`, err.message);
    // If OpenAI key exists, try it as last resort
    if (activeProvider !== 'openai' && OPENAI_API_KEY) {
      try { return await callOpenAI(messages, opts); } catch {}
    }
  }
  return callMock(messages);
}

function getStatus() {
  return {
    ready: activeProvider !== 'mock' && activeProvider !== null,
    mock: activeProvider === 'mock',
    provider: activeProvider || 'none',
    model: activeModel || (activeProvider === 'mock' ? 'mock' : 'none'),
    foundry_endpoint: FOUNDRY_ENDPOINT,
    ollama_endpoint: OLLAMA_ENDPOINT,
    openai_configured: !!OPENAI_API_KEY,
  };
}

module.exports = { initFoundry, chat, getStatus };
