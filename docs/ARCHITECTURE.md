# Architecture Deep Dive — AfyaPack

> Understanding the technical decisions behind an offline-first AI health app.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [The Offline-First Paradigm](#the-offline-first-paradigm)
3. [Foundry Local Integration](#foundry-local-integration)
4. [Retrieval-Augmented Generation (RAG)](#retrieval-augmented-generation-rag)
5. [Prompt Engineering Strategy](#prompt-engineering-strategy)
6. [Red Flag Engine](#red-flag-engine)
7. [Database Design](#database-design)
8. [Frontend Architecture](#frontend-architecture)
9. [API Design](#api-design)
10. [Multilingual Support](#multilingual-support)
11. [Fallback Strategy](#fallback-strategy)

---

## System Overview

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              AFYAPACK ARCHITECTURE                             │
├────────────────────┬──────────────────────┬────────────────────────────────────┤
│     WEB CLIENT     │      API SERVER      │         LOCAL AI LAYER             │
│                    │                      │                                    │
│  Next.js 14        │  Express.js          │   ┌────────────────────────┐       │
│  React Server      │  Node.js             │   │    FOUNDRY LOCAL       │       │
│  Components        │                      │   │    Qwen 2.5 (0.5B)     │       │
│                    │  Routes:             │   │    Port 54346          │       │
│  Pages:            │  /api/health         │   │                        │       │
│  - Dashboard       │  /api/chat  ──────────────►  /v1/chat/completions │       │
│  - Chat            │  /api/encounters     │   │                        │       │
│  - Encounter       │  /api/guidance       │   └────────────────────────┘       │
│  - Protocols       │  /api/referrals      │              ▲                     │
│  - Stock           │  /api/protocols      │              │                     │
│                    │  /api/stock          │   ┌──────────┴─────────────┐       │
│  Components:       │                      │   │   TF-IDF RETRIEVAL     │       │
│  - ChatComposer    │  ┌────────────┐      │   │   Protocol Chunks      │       │
│  - ChatMessage     │  │  SQLite    │◄─────────│   Cosine Similarity    │       │
│  - EncounterForm   │  │  (sql.js)  │      │   │   28 chunks / 5 docs   │       │
│  - RedFlagBanner   │  └────────────┘      │   └────────────────────────┘       │
│                    │                      │                                    │
│  IndexedDB         │  Tables:             │   ┌────────────────────────┐       │
│  - Offline queue   │  - encounters        │   │      FALLBACKS         │       │
│  - Draft data      │  - protocols         │   │   Ollama ──► Mock      │       │
│                    │  - protocol_chunks   │   └────────────────────────┘       │
│                    │  - referrals         │                                    │
│                    │  - stock_items       │                                    │
│                    │  - guidance          │                                    │
└────────────────────┴──────────────────────┴────────────────────────────────────┘
```

---

## The Offline-First Paradigm

### Why Offline Matters

AfyaPack is designed for **low-connectivity environments**:
- Remote health clinics with no internet
- Areas with unreliable power and connectivity
- Use cases where data must not leave the device

### Key Design Principles

| Principle | Implementation |
|-----------|----------------|
| **No cloud dependencies** | All AI inference runs locally via Foundry Local |
| **No external APIs** | No embedding APIs, no cloud RAG — everything local |
| **Embedded database** | SQLite compiled to WASM, runs in Node.js |
| **Local protocol storage** | Clinical guidelines are bundled with the app |
| **Graceful degradation** | Mock mode provides template responses if AI fails |

### Data Flow

```
User Message
    │
    ▼
┌─────────────────────────────────────┐
│         CHAT ENDPOINT               │
│                                     │
│  1. Detect language (Swahili/Eng)   │
│  2. Detect intent (clinical/stock)  │
│  3. Translate Swahili to English    │
│                                     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│         TF-IDF RETRIEVAL            │
│                                     │
│  1. Tokenize query                  │
│  2. Build TF-IDF vector             │
│  3. Calculate cosine similarity     │
│  4. Return top 4 chunks             │
│                                     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│         PROMPT BUILDER              │
│                                     │
│  System prompt + Retrieved chunks   │
│  + User question = Final prompt     │
│                                     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│         FOUNDRY LOCAL               │
│                                     │
│  Qwen 2.5 (0.5B parameters)         │
│  OpenAI-compatible API              │
│  Returns grounded response          │
│                                     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│         POST-PROCESSING             │
│                                     │
│  1. Swahili-ify if needed           │
│  2. Extract citations               │
│  3. Detect escalation needs         │
│  4. Return structured response      │
│                                     │
└─────────────────────────────────────┘
```

---

## Foundry Local Integration

### What is Foundry Local?

Foundry Local is Microsoft's local AI inference runtime. It:
- Runs AI models entirely on-device
- Exposes an OpenAI-compatible API
- Supports quantized models optimized for CPUs
- Requires no cloud connection

### Why Qwen 2.5 (0.5B)?

| Factor | Consideration |
|--------|---------------|
| **Size** | 0.5B parameters fits easily on any modern CPU |
| **Speed** | Fast inference even without GPU |
| **Quality** | Sufficient for guided, grounded responses |
| **Instruction-tuned** | Follows prompts reliably |

> **Trade-off:** A larger model (7B+) would give better answers but require more resources and slower inference.

### API Integration

```javascript
// services/foundry.js

async function callFoundry(messages, opts = {}) {
  const res = await fetch(`${FOUNDRY_ENDPOINT}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: FOUNDRY_MODEL,
      messages,
      max_tokens: opts.maxTokens || 700,
      temperature: opts.temperature ?? 0.3,
    }),
  });
  
  const data = await res.json();
  return data.choices[0].message.content;
}
```

### Configuration

```env
FOUNDRY_ENDPOINT=http://127.0.0.1:54346
FOUNDRY_MODEL=qwen2.5-0.5b-instruct-generic-cpu:4
```

---

## Retrieval-Augmented Generation (RAG)

### Why RAG?

The AI model has no inherent knowledge of clinical protocols. Without RAG:
- The model would hallucinate medical advice
- Responses would be generic and potentially dangerous
- There would be no way to verify accuracy

With RAG:
- Every response is grounded in retrieved documents
- Citations provide traceability
- The model summarizes verified information

### TF-IDF Implementation

We use **TF-IDF (Term Frequency-Inverse Document Frequency)** instead of embedding APIs because:
1. Works 100% offline — no embedding endpoint needed
2. Deterministic — same query always retrieves same chunks
3. Lightweight — no vector database required
4. Good enough for keyword-based clinical queries

```javascript
// services/retrieval.js

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

function computeTF(tokens) {
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const total = Math.max(tokens.length, 1);
  Object.keys(tf).forEach(t => { tf[t] = tf[t] / total; });
  return tf;
}

function computeIDF(allTokenArrays) {
  const docCount = allTokenArrays.length;
  const df = {};
  allTokenArrays.forEach(tokens => {
    new Set(tokens).forEach(t => { df[t] = (df[t] || 0) + 1; });
  });
  const idf = {};
  Object.keys(df).forEach(t => {
    idf[t] = Math.log((docCount + 1) / (df[t] + 1)) + 1;
  });
  return idf;
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0, magA = 0, magB = 0;
  Object.keys(vecA).forEach(k => {
    dot += vecA[k] * (vecB[k] || 0);
    magA += vecA[k] ** 2;
  });
  Object.values(vecB).forEach(v => { magB += v ** 2; });
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
```

### Protocol Chunking

Protocols are pre-chunked during database seeding:

```javascript
// db/seed.js

const PROTOCOLS = [
  {
    id: 'fever-dehydration-children',
    title: 'Fever and Dehydration in Children',
    sections: [
      { heading: 'Overview', text: '...' },
      { heading: 'Danger Signs', text: '...' },
      { heading: 'Management', text: '...' },
    ],
  },
];
```

Each section becomes a chunk with a precomputed TF-IDF vector stored in SQLite.

---

## Prompt Engineering Strategy

### System Prompt Design

The system prompt establishes critical constraints:

```javascript
const SYSTEM_PROMPT = `You are AfyaPack, a protocol-based clinical decision support tool.

CRITICAL RULES:
1. You are NOT a diagnostic tool. Never state a diagnosis.
2. Base your guidance ONLY on the protocol excerpts provided.
3. Always include a clear safety note.
4. Always state when referral is needed.
5. Cite which protocol sources your guidance is based on.
6. If protocols don't cover the presentation, explicitly say so.

RESPONSE FORMAT:
**Assessment Context** ...
**Protocol-Based Guidance** ...
**When to Refer/Escalate** ...
**Sources Used** ...
**Safety Note** ⚠️ ...`;
```

### User Prompt Construction

```javascript
function buildGuidancePrompt(encounter, retrievedChunks) {
  const chunkText = retrievedChunks
    .map((c, i) => `[${i + 1}] From "${c.doc_title}": ${c.content}`)
    .join('\n\n');

  return `PATIENT PRESENTATION:
- Age: ${encounter.age} years
- Sex: ${encounter.sex}
- Symptoms: ${encounter.symptoms.join(', ')}
- Temperature: ${encounter.temperature}°C

RETRIEVED PROTOCOL EXCERPTS:
${chunkText}

Based ONLY on the protocol excerpts above, provide structured guidance.`;
}
```

### Why This Works

| Technique | Purpose |
|-----------|---------|
| **Role definition** | "You are AfyaPack..." sets behavior expectations |
| **Critical rules** | Explicit constraints prevent dangerous outputs |
| **Grounding instruction** | "ONLY on the protocol excerpts" prevents hallucination |
| **Response format** | Structured output is easier to parse and verify |
| **Safety note requirement** | Every response includes a disclaimer |

---

## Red Flag Engine

### Why Rule-Based?

For critical safety decisions, we use **deterministic rules**, not AI predictions.

```javascript
// lib/redflags.js

export function screenRedFlags(encounter) {
  const flags = [];
  const { temperature, pulse } = encounter;

  if (temperature >= 40.0) {
    flags.push({
      severity: 'critical',
      message: `Dangerously high fever (${temperature}°C) — URGENT REFERRAL`,
      rule: 'temp_critical',
    });
  }

  if (pulse > 130) {
    flags.push({
      severity: 'critical',
      message: `Severe tachycardia (${pulse} bpm) — URGENT REFERRAL`,
      rule: 'pulse_critical',
    });
  }

  // ... more rules
  
  return flags;
}
```

### Why Not AI for Danger Signs?

| AI Prediction | Rule-Based |
|---------------|------------|
| Probabilistic — might miss critical cases | Deterministic — never misses defined patterns |
| Requires training data | Encodes clinical guidelines directly |
| "Black box" reasoning | Transparent, auditable logic |
| May vary between runs | Identical behavior every time |

> **Design principle:** Critical safety decisions should be deterministic, not probabilistic.

---

## Database Design

### Schema

```sql
-- Encounters (patient assessments)
CREATE TABLE encounters (
  id TEXT PRIMARY KEY,
  age INTEGER,
  sex TEXT,
  pregnant INTEGER,
  symptoms TEXT,           -- JSON array
  duration TEXT,
  temperature REAL,
  pulse INTEGER,
  danger_signs TEXT,       -- JSON array
  notes TEXT,
  red_flags TEXT,          -- JSON array (computed)
  created_at TEXT
);

-- Protocol chunks (for retrieval)
CREATE TABLE protocol_chunks (
  id INTEGER PRIMARY KEY,
  doc_id TEXT,
  doc_title TEXT,
  section TEXT,
  chunk_index INTEGER,
  content TEXT,
  tokens TEXT,             -- JSON array (tokenized)
  tfidf_vector TEXT,       -- JSON object (precomputed)
  tags TEXT                -- JSON array
);

-- Guidance (AI responses)
CREATE TABLE guidance (
  id TEXT PRIMARY KEY,
  encounter_id TEXT,
  guidance_text TEXT,
  citations TEXT,          -- JSON array
  safety_note TEXT,
  escalation_needed INTEGER,
  model TEXT,
  created_at TEXT
);
```

### SQLite via WASM

We use `better-sqlite3` for the API and can optionally use `sql.js` (SQLite compiled to WASM) for browser-side caching.

```javascript
// db/index.js

const Database = require('better-sqlite3');
const db = new Database(':memory:');

// Initialize schema
db.exec(SCHEMA);
```

---

## Frontend Architecture

### Tech Stack

| Library | Purpose |
|---------|---------|
| **Next.js 14** | React framework with App Router |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Animations and transitions |
| **Lucide React** | Icons |
| **IndexedDB (idb)** | Offline storage |

### Key Components

```
web/src/
├── app/                   # Next.js App Router pages
│   ├── page.js           # Dashboard
│   ├── chat/page.js      # AI Chat
│   ├── encounter/page.js # Triage form
│   └── ...
├── components/
│   ├── chat/
│   │   ├── ChatComposer.jsx   # Message input with voice
│   │   ├── ChatMessage.jsx    # Message bubble
│   │   └── WelcomeState.jsx   # Empty state
│   ├── EncounterForm.jsx      # 4-step triage form
│   ├── RedFlagBanner.jsx      # Danger sign alerts
│   └── ui/                    # Reusable UI components
└── lib/
    ├── api.js                 # API client
    ├── redflags.js            # Client-side screening
    └── utils.js               # Helpers
```

### Offline Handling

```javascript
// hooks/useOfflineStatus.js

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);
  
  return isOnline;
}
```

---

## API Design

### RESTful Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/health` | GET | System health check |
| `/api/chat` | POST | Agentic chat (main endpoint) |
| `/api/encounters` | GET/POST | Patient encounters |
| `/api/guidance` | POST | Generate clinical guidance |
| `/api/referrals` | POST | Generate referral notes |
| `/api/protocols` | GET | List protocols |
| `/api/protocols/search` | POST | Search protocol chunks |
| `/api/stock` | GET/PUT | Stock management |

### Chat Endpoint Flow

```javascript
// routes/chat.js

router.post('/', async (req, res) => {
  const { message, history } = req.body;
  
  // 1. Detect language
  const lang = detectLanguage(message);
  
  // 2. Detect intent
  const intent = detectIntent(message);
  
  // 3. Translate Swahili to English for retrieval
  const queryForModel = lang === 'sw' 
    ? swahiliToEnglish(message) 
    : message;
  
  // 4. Retrieve relevant chunks
  const chunks = await searchProtocols(queryForModel, 4);
  
  // 5. Build prompt
  const systemPrompt = buildSystemPrompt(lang, intent);
  const contextBlock = chunks.map(c => 
    `[${c.doc_title}]: ${c.content}`
  ).join('\n');
  
  // 6. Call Foundry Local
  const response = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `${message}\n\nContext:\n${contextBlock}` },
  ]);
  
  // 7. Post-process
  const finalReply = lang === 'sw' 
    ? swahilify(response) 
    : response;
  
  res.json({
    reply: finalReply,
    citations: chunks,
    language: lang,
  });
});
```

---

## Multilingual Support

### Language Detection

```javascript
const SWAHILI_PATTERNS = /\b(homa|kuhara|mtoto|mgonjwa|dawa|mimba|dalili|...)\b/i;

function detectLanguage(message) {
  const matches = (message.match(SWAHILI_PATTERNS) || []).length;
  return matches >= 1 ? 'sw' : 'en';
}
```

### Swahili Translation (Pre-Model)

```javascript
const SW_TO_EN = {
  homa: 'fever',
  kuhara: 'diarrhea',
  kutapika: 'vomiting',
  // ...
};

function swahiliToEnglish(text) {
  let translated = text;
  for (const [sw, en] of Object.entries(SW_TO_EN)) {
    translated = translated.replace(new RegExp(`\\b${sw}\\b`, 'gi'), en);
  }
  return translated;
}
```

### Swahili-ification (Post-Model)

```javascript
function swahilify(text) {
  return text
    .replace(/\*\*Assessment[:\s]*/gi, '**Tathmini (Assessment):** ')
    .replace(/\*\*Action steps?[:\s]*/gi, '**Hatua za kuchukua:**\n')
    .replace(/\bfever\b/gi, 'homa (fever)')
    // ...
}
```

---

## Fallback Strategy

### Priority Order

1. **Foundry Local** — Primary
2. **Ollama** — Secondary (if installed)
3. **Mock Mode** — Last resort

```javascript
// services/foundry.js

async function initFoundry() {
  // Try Foundry Local
  if (await tryFoundry()) {
    activeProvider = 'foundry';
    return;
  }
  
  // Try Ollama
  if (await tryOllama()) {
    activeProvider = 'ollama';
    return;
  }
  
  // Fall back to mock
  activeProvider = 'mock';
  console.warn('No AI provider available — using mock mode');
}
```

### Mock Mode

Provides template responses when no AI is available:

```javascript
function callMock(messages) {
  const userMsg = messages.find(m => m.role === 'user')?.content || '';
  const hasFever = /fever|homa/i.test(userMsg);
  
  return `**Clinical Guidance (Protocol-Based)**

Based on retrieved local protocols:
${hasFever ? '**Fever management:** Give paracetamol per weight.' : ''}

**Recommended Actions**
1. Complete primary assessment
2. Monitor vital signs

*[Demo mode — connect to Foundry Local for real AI guidance]*`;
}
```

---

## Summary

AfyaPack's architecture is designed around these principles:

1. **Offline-first** — Everything runs locally
2. **Grounded AI** — Every response cites sources
3. **Deterministic safety** — Critical decisions use rules, not predictions
4. **Graceful degradation** — Falls back through providers to mock mode
5. **Multilingual** — Adapts to English and Swahili

This architecture supports the core mission: **reliable AI assistance for health workers in low-connectivity environments.**
