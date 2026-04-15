# Lesson 05: Foundry Integration

> Connect your API to Foundry Local for AI-powered responses.

---

## Lesson Overview

| | |
|---|---|
| **Duration** | 35 minutes |
| **Objective** | Implement LLM service with provider detection and fallback |
| **Output** | Working AI-powered `/api/guidance` and `/api/chat` endpoints |
| **Prerequisites** | Lesson 04 (Backend API complete) |
| **Files/Folders** | `api/src/services/foundry.js`, `api/src/services/prompts.js` |

---

## What We're Building

```
Request Flow:
┌─────────┐    ┌──────────┐    ┌───────────────┐
│ Browser │───▶│ Express  │───▶│ Foundry Local │
└─────────┘    │   API    │    │   (Qwen 2.5)  │
               └──────────┘    └───────────────┘
                    │                 ▲
                    │    Fallback     │
                    ▼                 │
               ┌──────────┐          │
               │  Ollama  │──────────┘
               │(mistral) │
               └──────────┘
```

**Provider Priority:**
1. **Foundry Local** — Primary (fastest, local)
2. **Ollama** — Fallback if Foundry unavailable
3. **Mock Mode** — Demo mode without any LLM

---

## Step 1: Create the Foundry Service

Create file `api/src/services/foundry.js`:

### Copilot Prompt

```
@workspace Create a Foundry Local service module that:
- Uses fetch to call the OpenAI-compatible API at http://127.0.0.1:54346
- Provides generateText(prompt, systemPrompt) function
- Tries Foundry Local first, then Ollama at http://localhost:11434
- Returns { text, model, source } where source is 'foundry' | 'ollama' | 'mock'
- Includes provider detection with health check
- Has 60 second timeout for Foundry, 300 for Ollama
- Falls back to mock response if both fail
```

### Expected Code

```javascript
const FOUNDRY_URL = process.env.FOUNDRY_URL || 'http://127.0.0.1:54346';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL_FOUNDRY = 'qwen2.5-0.5b-instruct-generic-cpu:4';
const MODEL_OLLAMA = 'mistral:latest';

let cachedProvider = null;

// Timeout wrapper
function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeout));
}

// Try Foundry Local
async function tryFoundry(prompt, systemPrompt) {
  const response = await fetchWithTimeout(
    `${FOUNDRY_URL}/v1/chat/completions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_FOUNDRY,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.3,
      }),
    },
    60000
  );

  if (!response.ok) {
    throw new Error(`Foundry error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.choices?.[0]?.message?.content || '',
    model: MODEL_FOUNDRY,
    source: 'foundry',
  };
}

// Try Ollama
async function tryOllama(prompt, systemPrompt) {
  const response = await fetchWithTimeout(
    `${OLLAMA_URL}/api/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_OLLAMA,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        stream: false,
      }),
    },
    300000
  );

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.message?.content || '',
    model: MODEL_OLLAMA,
    source: 'ollama',
  };
}

// Mock response for demo mode
function mockResponse() {
  return {
    text: `**Response generated in demo mode**

Based on the symptoms described, this appears to be a case that requires careful assessment.

**Key Actions:**
1. Check vital signs (temperature, pulse, respirations)
2. Assess hydration status
3. Review available protocol guidelines

**Important:** This is a demonstration response. In production, guidance would be grounded in clinical protocols.

*[Demo Mode - No LLM connected]*`,
    model: 'mock',
    source: 'mock',
  };
}

// Check which provider is available
async function detectProvider() {
  if (cachedProvider) return cachedProvider;

  // Try Foundry
  try {
    const res = await fetchWithTimeout(
      `${FOUNDRY_URL}/v1/models`,
      { method: 'GET' },
      5000
    );
    if (res.ok) {
      console.log('[LLM] Foundry Local detected');
      cachedProvider = 'foundry';
      return 'foundry';
    }
  } catch (e) {
    // Foundry not available
  }

  // Try Ollama
  try {
    const res = await fetchWithTimeout(
      `${OLLAMA_URL}/api/tags`,
      { method: 'GET' },
      5000
    );
    if (res.ok) {
      console.log('[LLM] Ollama detected as fallback');
      cachedProvider = 'ollama';
      return 'ollama';
    }
  } catch (e) {
    // Ollama not available
  }

  console.log('[LLM] No provider detected - running in mock mode');
  cachedProvider = 'mock';
  return 'mock';
}

// Main generation function
async function generateText(prompt, systemPrompt = '') {
  const provider = await detectProvider();

  try {
    if (provider === 'foundry') {
      return await tryFoundry(prompt, systemPrompt);
    }
    
    if (provider === 'ollama') {
      return await tryOllama(prompt, systemPrompt);
    }
  } catch (err) {
    console.error(`[LLM] ${provider} failed:`, err.message);
    
    // Try the other provider
    try {
      if (provider === 'foundry') {
        cachedProvider = null; // Reset cache
        return await tryOllama(prompt, systemPrompt);
      }
    } catch (fallbackErr) {
      console.error('[LLM] Fallback also failed');
    }
  }

  return mockResponse();
}

// Get provider status for health check
async function getProviderStatus() {
  const provider = await detectProvider();
  return {
    activeProvider: provider,
    foundryUrl: FOUNDRY_URL,
    ollamaUrl: OLLAMA_URL,
    models: {
      foundry: MODEL_FOUNDRY,
      ollama: MODEL_OLLAMA,
    },
  };
}

module.exports = {
  generateText,
  detectProvider,
  getProviderStatus,
};
```

**✓ Checkpoint:** Foundry service with fallback chain.

---

## Step 2: Create the Prompts Service

Create file `api/src/services/prompts.js`:

### Copilot Prompt

```
@workspace Create a prompts service module with:
- buildSystemPrompt() - Returns the CHW assistant system prompt
- buildGuidancePrompt(encounter, protocolChunks) - Builds user prompt with context
- System prompt should emphasize: NOT diagnostic, protocol-grounded, community health focus
- Include safety rules about escalation
```

### Expected Code

```javascript
// System prompt for the CHW assistant
function buildSystemPrompt() {
  return `You are an AI clinical decision-support assistant for Community Health Workers (CHWs) in Tanzania.

## CRITICAL RULES — Follow these exactly:

1. This is NOT a diagnostic tool. You provide protocol-based GUIDANCE to support CHWs, not diagnoses.

2. Base your guidance ONLY on the protocol excerpts provided below [PROTOCOL CONTEXT]. Do not use external medical knowledge.

3. If the case falls outside the provided protocols, say: "This case requires clinical review. Please refer to your supervisor or nearest health facility."

4. Always recommend escalation for:
   - Danger signs (convulsions, unconscious, unable to drink/feed)
   - Very high fever (≥40°C) or hypothermia (<35.5°C)
   - Severe dehydration
   - Pregnancy complications

5. Structure your response clearly with:
   - **Assessment** (brief)
   - **Recommended Actions** (numbered)
   - **Red Flags to Watch** (if any)
   - **When to Refer** (specific criteria)

6. Use simple language appropriate for CHWs.

7. Cite the protocol section when giving advice, e.g., "[Malaria Protocol, Section 2]"

8. When uncertain, acknowledge limits: "Based on available protocols, I recommend... but please verify with your supervisor."`;
}

// Build the user prompt with encounter context
function buildGuidancePrompt(encounter, protocolChunks = []) {
  const parts = [];

  // Protocol context
  if (protocolChunks.length > 0) {
    parts.push('## [PROTOCOL CONTEXT]');
    protocolChunks.forEach((chunk, i) => {
      parts.push(`\n### Source ${i + 1}: ${chunk.doc_title} — ${chunk.section}`);
      parts.push(chunk.content);
    });
    parts.push('\n---\n');
  } else {
    parts.push('## [PROTOCOL CONTEXT]');
    parts.push('No specific protocols available for this query. Provide general guidance and recommend supervisor consultation.\n---\n');
  }

  // Patient information
  parts.push('## PATIENT INFORMATION');
  parts.push(`- **Age:** ${encounter.age || 'Unknown'} years`);
  parts.push(`- **Sex:** ${encounter.sex || 'Unknown'}`);
  
  if (encounter.pregnant) {
    parts.push('- **Pregnant:** Yes ⚠️');
  }
  
  if (encounter.temperature) {
    const temp = parseFloat(encounter.temperature);
    const tempWarning = temp >= 39 ? ' ⚠️ ELEVATED' : temp < 36 ? ' ⚠️ LOW' : '';
    parts.push(`- **Temperature:** ${encounter.temperature}°C${tempWarning}`);
  }
  
  if (encounter.pulse) {
    const pulse = parseInt(encounter.pulse);
    const pulseWarning = pulse > 110 ? ' ⚠️ ELEVATED' : pulse < 60 ? ' ⚠️ LOW' : '';
    parts.push(`- **Pulse:** ${encounter.pulse} bpm${pulseWarning}`);
  }

  // Symptoms
  const symptoms = Array.isArray(encounter.symptoms) ? encounter.symptoms : [];
  if (symptoms.length > 0) {
    parts.push(`- **Presenting Symptoms:** ${symptoms.join(', ')}`);
  }

  if (encounter.duration) {
    parts.push(`- **Duration:** ${encounter.duration}`);
  }

  // Danger signs
  const dangerSigns = Array.isArray(encounter.danger_signs) ? encounter.danger_signs : [];
  if (dangerSigns.length > 0) {
    parts.push(`- **Danger Signs Reported:** ⚠️ ${dangerSigns.join(', ')}`);
  }

  // Red flags from screening
  const redFlags = Array.isArray(encounter.red_flags) ? encounter.red_flags : [];
  if (redFlags.length > 0) {
    parts.push('\n## ⚠️ AUTOMATED RED FLAG ALERTS');
    redFlags.forEach(flag => {
      parts.push(`- [${flag.severity.toUpperCase()}] ${flag.message}`);
    });
  }

  // Notes
  if (encounter.notes) {
    parts.push(`\n**Additional Notes:** ${encounter.notes}`);
  }

  // Request
  parts.push('\n---');
  parts.push('\n## REQUEST');
  parts.push('Based on the patient information and protocol context above, provide clinical decision support guidance for the CHW managing this case.');

  return parts.join('\n');
}

// Build a simple chat prompt
function buildChatPrompt(message, history = []) {
  const parts = [];
  
  // Last few messages for context
  const recentHistory = history.slice(-4);
  if (recentHistory.length > 0) {
    parts.push('## Recent conversation:');
    recentHistory.forEach(msg => {
      const role = msg.role === 'user' ? 'CHW' : 'Assistant';
      parts.push(`${role}: ${msg.content}`);
    });
    parts.push('\n---\n');
  }
  
  parts.push(`## Current question:\n${message}`);
  
  return parts.join('\n');
}

module.exports = {
  buildSystemPrompt,
  buildGuidancePrompt,
  buildChatPrompt,
};
```

---

## Step 3: Create the Guidance Route

Create file `api/src/routes/guidance.js`:

### Copilot Prompt

```
@workspace Create an Express router for /api/guidance that:
- POST / accepts encounterId in body
- Fetches the encounter from database
- Searches protocols for relevant context
- Calls generateText with built prompts
- Saves guidance to database
- Returns the AI-generated guidance with citations
```

### Expected Code

```javascript
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/index');
const { generateText, getProviderStatus } = require('../services/foundry');
const { buildSystemPrompt, buildGuidancePrompt } = require('../services/prompts');
const { searchProtocols } = require('../services/retrieval');

const router = express.Router();

router.post('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { encounterId } = req.body;
    
    if (!encounterId) {
      return res.status(400).json({ error: 'encounterId is required' });
    }
    
    // Get encounter
    const db = getDB();
    const encounter = db.prepare('SELECT * FROM encounters WHERE id = ?').get(encounterId);
    
    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }
    
    // Parse JSON fields
    const parsedEncounter = {
      ...encounter,
      symptoms: JSON.parse(encounter.symptoms || '[]'),
      danger_signs: JSON.parse(encounter.danger_signs || '[]'),
      red_flags: JSON.parse(encounter.red_flags || '[]'),
    };
    
    // Search for relevant protocols
    const searchQuery = [
      ...(parsedEncounter.symptoms || []),
      parsedEncounter.age < 5 ? 'child' : 'adult',
      parsedEncounter.pregnant ? 'pregnancy' : '',
    ].filter(Boolean).join(' ');
    
    const protocolChunks = searchProtocols(searchQuery, 4);
    
    // Build prompts
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildGuidancePrompt(parsedEncounter, protocolChunks);
    
    // Generate guidance
    console.log(`[Guidance] Generating for encounter ${encounterId}...`);
    const result = await generateText(userPrompt, systemPrompt);
    
    // Extract citations from protocol chunks
    const citations = protocolChunks.map(chunk => ({
      docId: chunk.doc_id,
      docTitle: chunk.doc_title,
      section: chunk.section,
    }));
    
    // Determine if escalation needed
    const hasRedFlags = parsedEncounter.red_flags.some(f => f.severity === 'critical');
    const textMentionsReferral = result.text.toLowerCase().includes('refer');
    const escalationNeeded = hasRedFlags || textMentionsReferral;
    
    // Save guidance
    const guidanceId = uuidv4();
    db.prepare(`
      INSERT INTO guidance (id, encounter_id, guidance_text, citations, safety_note, escalation_needed, model)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      guidanceId,
      encounterId,
      result.text,
      JSON.stringify(citations),
      escalationNeeded ? 'Escalation recommended' : null,
      escalationNeeded ? 1 : 0,
      result.model
    );
    
    const duration = Date.now() - startTime;
    console.log(`[Guidance] Generated in ${duration}ms (${result.source})`);
    
    res.json({
      id: guidanceId,
      encounterId,
      guidance: result.text,
      citations,
      escalationNeeded,
      model: result.model,
      source: result.source,
      durationMs: duration,
    });
  } catch (err) {
    console.error('[Guidance] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get guidance for an encounter
router.get('/:encounterId', (req, res) => {
  try {
    const db = getDB();
    const guidance = db.prepare(`
      SELECT * FROM guidance 
      WHERE encounter_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(req.params.encounterId);
    
    if (!guidance) {
      return res.status(404).json({ error: 'No guidance found for this encounter' });
    }
    
    res.json({
      ...guidance,
      citations: JSON.parse(guidance.citations || '[]'),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

---

## Step 4: Update Health Route with Provider Status

### Copilot Prompt

```
@workspace Update the health route to include AI provider status from getProviderStatus()
```

Update `api/src/routes/health.js`:

```javascript
const express = require('express');
const { getDB } = require('../db/index');
const { getProviderStatus } = require('../services/foundry');

const router = express.Router();

router.get('/', async (req, res) => {
  let dbStatus = 'unknown';
  let protocolCount = 0;
  
  try {
    const db = getDB();
    const row = db.prepare('SELECT COUNT(*) as count FROM protocol_chunks').get();
    protocolCount = row.count;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }
  
  // Get AI provider status
  const aiStatus = await getProviderStatus();
  
  res.json({
    status: 'ok',
    message: 'AfyaPack API is running',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      protocolCount,
      ai: aiStatus,
    },
  });
});

module.exports = router;
```

---

## Step 5: Wire Up Guidance Route

Update `api/src/index.js` to add the guidance route:

```javascript
const guidanceRouter = require('./routes/guidance');
// ...
app.use('/api/guidance', guidanceRouter);
```

---

## Step 6: Test the Integration

### Verify Foundry is Running

```powershell
# Check Foundry models
curl http://127.0.0.1:54346/v1/models
```

### Test Health Endpoint

```powershell
curl http://localhost:3001/api/health
```

Expected response shows AI provider:
```json
{
  "services": {
    "ai": {
      "activeProvider": "foundry",
      "foundryUrl": "http://127.0.0.1:54346"
    }
  }
}
```

### Test Full Flow

```powershell
# 1. Create an encounter
$encounter = curl -X POST http://localhost:3001/api/encounters `
  -H "Content-Type: application/json" `
  -d '{
    "age": 3,
    "sex": "male",
    "symptoms": ["fever", "vomiting"],
    "temperature": 39.2,
    "pulse": 115
  }'

# 2. Get guidance (use the returned encounter ID)
curl -X POST http://localhost:3001/api/guidance `
  -H "Content-Type: application/json" `
  -d '{"encounterId": "THE-ENCOUNTER-ID"}'
```

**✓ Checkpoint:** AI generates guidance based on encounter data.

---

## Understanding the Response

The guidance endpoint returns:

```json
{
  "id": "guid-here",
  "encounterId": "original-encounter-id",
  "guidance": "## Assessment\nBased on the presenting symptoms...",
  "citations": [
    {"docId": "malaria", "docTitle": "Malaria Protocol", "section": "Assessment"}
  ],
  "escalationNeeded": true,
  "model": "qwen2.5-0.5b-instruct-generic-cpu:4",
  "source": "foundry",
  "durationMs": 2340
}
```

---

## Validation Checklist

- [ ] `/api/health` shows `activeProvider: foundry` (or ollama)
- [ ] Creating encounter returns red flags for elevated vitals
- [ ] `/api/guidance` generates AI response
- [ ] Response includes model name and source
- [ ] Duration is reasonable (< 10s for Foundry, < 60s for Ollama)
- [ ] Guidance mentions referral for red flag cases

---

## Troubleshooting

### "activeProvider: mock"
Foundry Local isn't running. Start it first:
```powershell
foundry service start
```

### Slow responses (> 30s)
This is normal for first request (model loading). Subsequent requests are faster.

### "No specific protocols available"
Expected at this stage — we'll add protocol seeding in Lesson 07.

---

## What You Learned

- How to build a provider abstraction layer
- How to implement fallback chains for resilience
- How to structure prompts for medical AI
- How to integrate LLM responses into API endpoints
- How to track response metadata (model, timing, source)

---

## Next Step

**Proceed to Lesson 06:** Chat Experience

You'll build the real-time chat interface on the frontend.

---

*AI is connected. Let's build the conversation layer. →*
