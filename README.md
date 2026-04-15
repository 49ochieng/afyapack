# AfyaPack — Offline-First AI Health Decision Support

> **Protocol-grounded clinical guidance for frontline health workers. No internet required. Runs on any device.**

AfyaPack is a full-stack AI health assistant that works entirely offline, using local language models to provide grounded, citation-backed clinical decision support to health workers in low-resource settings. It supports English and Swahili, runs on both desktop and mobile, and exposes its intelligence through a conversational AI chat interface backed by an agentic routing layer.

---

## 🎓 Hands-On Lab Experience

**Building this yourself?** This project includes a complete step-by-step lab curriculum:

| Resource | Description |
|----------|-------------|
| [**LAB_README.md**](LAB_README.md) | Start here — full lab overview and learning path |
| [**labs/**](labs/) | 14 progressive lessons (00-13) from setup to polish |
| [**docs/**](docs/) | Setup guides, architecture docs, instructor materials |
| [**prompts/**](prompts/) | Copilot prompt library for healthcare AI development |

The lab teaches **Foundry Local**, **GitHub Copilot**, **RAG patterns**, and **responsible AI** through building AfyaPack from scratch.

---

## Table of Contents

1. [The Problem](#the-problem)
2. [What AfyaPack Does](#what-afyapack-does)
3. [Live Demo Walkthrough](#live-demo-walkthrough)
4. [Architecture Overview](#architecture-overview)
5. [How the AI Works](#how-the-ai-works)
6. [Foundry Local — The Core Advantage](#foundry-local--the-core-advantage)
7. [Ollama as Fallback](#ollama-as-fallback)
8. [How We Used AI Toolkit and Foundry Local](#how-we-used-ai-toolkit-and-foundry-local)
9. [The MCP Server](#the-mcp-server)
10. [Step-by-Step Setup Guide](#step-by-step-setup-guide)
11. [Environment Configuration](#environment-configuration)
12. [API Reference](#api-reference)
13. [Agentic Chat Routing](#agentic-chat-routing)
14. [Multilingual Support (Swahili)](#multilingual-support-swahili)
15. [Red Flag Screening Engine](#red-flag-screening-engine)
16. [Retrieval Pipeline (TF-IDF RAG)](#retrieval-pipeline-tf-idf-rag)
17. [Scalability and Deployment](#scalability-and-deployment)
18. [Containerization Strategy](#containerization-strategy)
19. [Mobile Strategy](#mobile-strategy)
20. [How We Built AfyaPack with AI](#how-we-built-afyapack-with-ai)
21. [Prompts and Prompt Engineering](#prompts-and-prompt-engineering)
22. [Responsible AI Design](#responsible-ai-design)
23. [Project Structure](#project-structure)
24. [Tech Stack](#tech-stack)

---

## The Problem

Frontline health workers in remote and rural areas manage complex patient presentations without access to specialist consultation, reference libraries, or stable internet. They make life-or-death decisions under pressure, often alone. When a child arrives with fever, convulsions, and signs of dehydration — the worker must instantly recall multi-step clinical protocols while managing the patient.

**AfyaPack solves this.** It puts an AI clinical assistant in their pocket that:
- Works with no internet connection
- Speaks their language (English and Swahili)
- Gives grounded, cited guidance from real clinical protocols
- Screens for danger signs automatically
- Generates referral documents when needed
- Tracks medicine stock levels

---

## What AfyaPack Does

| Feature | Description |
|---|---|
| **AI Chat** | Natural language Q&A — ask in English or Swahili, get protocol-grounded answers |
| **Patient Encounter Triage** | 4-step structured intake with live danger sign screening |
| **Protocol-Grounded Guidance** | AI answers are grounded exclusively in local protocol documents |
| **Red Flag Screening** | Rule-based engine fires before AI — instant alerts for critical vitals |
| **Referral Generator** | AI writes a structured handoff note, editable before printing |
| **Stock Tracker** | Medicine and supply inventory with low-stock alerts |
| **Protocol Library** | Full-text search across clinical guidelines, available offline |
| **Swahili Support** | Language auto-detection, adapted system prompts, medical term translation |
| **MCP Server** | 13 tools exposable to Claude and AI assistants via Model Context Protocol |
| **Voice Input** | Speech-to-text transcription in the chat composer (Web Speech API) |

---

## Live Demo Walkthrough

### 1. Dashboard

The dashboard greets the user with live system status — AI model readiness, protocol count, stock alerts — and a one-tap chat entry point with contextual quick prompts.

### 2. AI Chat (the heart of the app)

```
User: "Mtoto wa miaka 2 ana homa na kuhara, ameshindwa kunywa. Nifanye nini?"
(Child of 2 years has fever and diarrhea, unable to drink. What do I do?)
```

AfyaPack:
- Detects Swahili → switches system prompt to Kiswahili
- Detects clinical intent → runs protocol search
- Retrieves top 4 chunks from local protocol documents
- Calls local AI model with retrieved context
- Returns grounded response with citations and escalation flag

**Response includes:**
- Protocol-based action steps
- Source citations (e.g. "Fever and Dehydration in Children — Danger Signs")
- Escalation warning if danger signs detected
- Safety note reminding user this is decision support only

### 3. Structured Encounter Flow

For more complex assessments, the 4-step guided triage form captures:
- **Step 1 — Patient:** Age, sex, pregnancy status
- **Step 2 — Symptoms:** Quick-select chips + custom input (English or Swahili)
- **Step 3 — Vitals:** Temperature (with fever classification), pulse (with tachycardia detection)
- **Step 4 — Danger Signs:** Checkbox-driven critical sign selection

Live red flag alerts appear as the form fills — before any AI call.

### 4. Clinical Guidance

After encounter submission, the app:
1. Builds a semantic search query from the patient presentation
2. Retrieves top 4 protocol chunks by cosine similarity
3. Calls the local AI with a strict system prompt and retrieved context
4. Displays structured guidance with numbered citations

### 5. Referral Note

One tap generates a structured clinical handoff note, pre-populated with patient data and clinical concern. Editable before copy/save. Works offline — no print server needed.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AFYAPACK SYSTEM                         │
├──────────────────────┬──────────────────────┬───────────────────┤
│    FRONTEND (Web)    │    BACKEND (API)     │   LOCAL AI LAYER  │
│    Next.js 14        │    Node.js + Express │                   │
│    Tailwind CSS      │    Port 3001         │  ┌─────────────┐  │
│    Framer Motion     │                      │  │Foundry Local│  │
│    Port 3000         │  ┌───────────────┐   │  │qwen2.5-0.5b │  │
│                      │  │ SQLite        │   │  │Port 54346   │  │
│  ┌───────────────┐   │  │ (sql.js WASM) │   │  └──────┬──────┘  │
│  │ Chat UI       │   │  │               │   │         │ fallback │
│  │ Encounter Form│◄──┤  │ Protocols DB  │   │  ┌──────▼──────┐  │
│  │ Guidance View │   │  │ Encounters    │   │  │   Ollama    │  │
│  │ Stock Tracker │   │  │ Guidance      │   │  │ mistral:    │  │
│  │ Protocol Lib  │   │  │ Referrals     │   │  │ latest      │  │
│  └───────┬───────┘   │  │ Stock Items   │   │  │Port 11434   │  │
│          │           │  └───────────────┘   │  └──────┬──────┘  │
│  IndexedDB (idb)     │                      │         │ fallback │
│  - Offline queue     │  ┌───────────────┐   │  ┌──────▼──────┐  │
│  - UI state cache    │  │ TF-IDF Engine │   │  │  Mock Mode  │  │
│  - Encounter drafts  │  │ 28 chunks     │   │  │ Template AI │  │
│                      │  │ 5 protocols   │   │  └─────────────┘  │
└──────────────────────┴──┴───────────────┴───┴───────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   MCP SERVER      │
                    │  13 Tools         │
                    │  Swahili Support  │
                    │  Claude Code CLI  │
                    └───────────────────┘
```

**Key design decisions:**

- **sql.js (WASM SQLite):** Native `better-sqlite3` fails to compile on Node 24. `sql.js` is pure WebAssembly — no native compilation, runs anywhere, persists to disk asynchronously. A compatibility shim exposes the same synchronous API.
- **No cloud dependency:** Every API call resolves locally. The app will work on a laptop in the bush with no SIM card.
- **Provider waterfall:** Foundry Local → Ollama → Mock. The app degrades gracefully — retrieval and rule-based screening still work even without any AI model.

---

## How the AI Works

AfyaPack uses a **Retrieval-Augmented Generation (RAG)** pattern, but entirely offline:

```
User Question
     │
     ▼
Intent Detection (rule-based regex)
     │
     ├── clinical  → Protocol Search (TF-IDF)
     ├── stock     → SQLite stock query
     └── general   → pass-through
     │
     ▼
Context Assembly
(retrieved chunks injected into prompt)
     │
     ▼
Local AI Model (Foundry Local / Ollama)
     │
     ▼
Structured Response
 + citations
 + escalation flag
 + language tag
```

### Why RAG instead of fine-tuning?

Fine-tuning a model requires compute, data curation, and retraining when protocols change. RAG lets us:
- Update clinical protocols by editing text files — no ML pipeline
- Ground every response in verifiable sources
- Cite the exact protocol section used
- Prevent the model from hallucinating clinical facts outside the corpus

### The Retrieval Engine (built from scratch in JavaScript)

No external vector database. The TF-IDF + cosine similarity engine runs entirely in the Node.js process:

```javascript
// tokenize → compute TF → compute IDF → build vector → cosine similarity
const query = "fever dehydration child convulsions";
const chunks = searchProtocols(query, 4);
// Returns ranked chunks with doc title, section, score, and raw text
```

**Why TF-IDF over embeddings?**

Embeddings require a model call or a large embedding model on disk. TF-IDF:
- Runs in < 5ms per query (in-memory)
- Requires zero additional AI model
- Works perfectly offline with no network call
- Produces explainable relevance scores
- Is easily extendable by adding protocol documents

---

## Foundry Local — The Core Advantage

[Foundry Local](https://aka.ms/foundry-local) is Microsoft's runtime for running AI models directly on-device. AfyaPack uses it to power its AI guidance without any cloud API.

### Why Foundry Local matters for this use case

| Property | Benefit for AfyaPack |
|---|---|
| **On-device inference** | Works in areas with no internet connectivity |
| **OpenAI-compatible API** | Drop-in replacement — same `POST /v1/chat/completions` call |
| **Quantized models** | `qwen2.5-0.5b` runs on CPU with 4-bit quantization — ~1.5 GB RAM |
| **Lightweight runtime** | The Foundry Local daemon is a small background service |
| **No data leaves the device** | Patient data stays local — critical for healthcare privacy |
| **Cross-platform** | Windows, macOS, Linux — same API everywhere |

### The containerization advantage

Because Foundry Local exposes a standard OpenAI-compatible HTTP API (`http://localhost:54346/v1`), it can be swapped with any compatible runtime — including containerized deployments:

```
Docker Compose approach (future scale):
┌──────────────────┐   HTTP   ┌─────────────────────┐
│ AfyaPack API     │ ────────► │ Foundry Local       │
│ (Node container) │          │ (sidecar container) │
└──────────────────┘          └─────────────────────┘
```

The same codebase that runs on a health worker's laptop can be deployed as microservices in a clinic's local network — serving multiple tablets from a single AI inference server. This enables a **hub-and-spoke model**:
- One AI server (Raspberry Pi 5 / clinic PC) running Foundry Local
- Multiple mobile tablets accessing it over local WiFi
- No internet required at any point in the chain

### Starting Foundry Local

```bash
# Install Foundry Local CLI
winget install Microsoft.FoundryLocal   # Windows
brew install foundry-local              # macOS

# Pull and run the model (downloads ~1.5 GB once)
foundry model run qwen2.5-0.5b

# Verify it's running
curl http://127.0.0.1:54346/v1/models
```

AfyaPack automatically detects Foundry Local on startup:

```javascript
// api/src/services/foundry.js
async function tryFoundry() {
  const res = await fetchWithTimeout(
    `${FOUNDRY_ENDPOINT}/v1/chat/completions`,
    { method: 'POST', body: JSON.stringify({ model: FOUNDRY_MODEL,
      messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5 }) },
    5000  // 5 second probe timeout
  );
  return res.ok;
}
```

---

## Ollama as Fallback

[Ollama](https://ollama.com) provides an alternative local inference runtime. AfyaPack falls back to Ollama automatically if Foundry Local is not running:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh   # Linux/macOS
# Or download from https://ollama.com on Windows

# Pull a model
ollama pull mistral
# or smaller:
ollama pull qwen2.5:0.5b

# Verify
ollama list
```

AfyaPack uses Ollama's OpenAI-compatible endpoint (`/v1/chat/completions`) — the same code path as Foundry Local:

```javascript
// Identical call signature — provider is transparent to the rest of the app
const res = await fetch(`${OLLAMA_ENDPOINT}/v1/chat/completions`, {
  method: 'POST',
  body: JSON.stringify({ model: OLLAMA_MODEL, messages, max_tokens: 700 })
});
```

**Provider priority order:**

```
Startup probe (5s timeout each):
1. Foundry Local at :54346  → use if reachable
2. Ollama at :11434         → use if reachable
3. Mock mode                → template responses, retrieval still active
```

---

## How We Used AI Toolkit and Foundry Local

### VS Code AI Toolkit

The [VS Code AI Toolkit extension](https://marketplace.visualstudio.com/items?itemName=ms-windows-ai-studio.windows-ai-studio) was used during development to:

1. **Browse and evaluate models** — We used the model catalog to compare `qwen2.5-0.5b`, `phi-3.5-mini`, and `Llama-3.2-1B` for our use case (low-latency clinical Q&A on CPU)
2. **Run inference playground** — Before integrating into the API, we tested prompts directly in the AI Toolkit playground to measure response quality and token usage
3. **Validate the OpenAI-compat API** — The AI Toolkit shows the exact endpoint and model ID to use in code
4. **Fine-tuning exploration** — We evaluated whether fine-tuning on clinical protocol data would improve quality (conclusion: RAG grounding was more reliable and maintainable than fine-tuning a 0.5B model)

**Model selection rationale:**

| Model | Size | Latency (CPU) | Quality | Chosen |
|---|---|---|---|---|
| `qwen2.5-0.5b` | ~1.5 GB | 8–20s | Good for structured output | ✅ Primary |
| `phi-3.5-mini` | ~2.2 GB | 15–40s | Better reasoning | Backup |
| `mistral:latest` | ~4 GB | 30–60s | Best quality | ✅ Ollama fallback |

The 0.5B parameter model was chosen for Foundry Local because it runs on CPU without requiring a GPU, making it suitable for low-cost clinic hardware.

### Foundry Local Integration

AfyaPack bypasses the official Foundry Local SDK and calls the HTTP API directly. This was a deliberate choice after discovering SDK initialization issues:

```javascript
// Direct HTTP — stable, dependency-free, future-proof
const response = await fetch('http://127.0.0.1:54346/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'qwen2.5-0.5b-instruct-generic-cpu:4',
    messages: conversationHistory,
    max_tokens: 700,
    temperature: 0.25   // Low temperature for clinical consistency
  })
});
```

This approach means AfyaPack works with **any OpenAI-compatible endpoint** — Foundry Local, Ollama, Azure OpenAI, or a self-hosted vLLM server — by changing a single environment variable.

---

## The MCP Server

AfyaPack exposes its capabilities as a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server, allowing Claude Code and other AI assistants to call AfyaPack's tools directly.

```bash
# The MCP server registers with Claude Code
claude mcp add afyapack node C:/copilot/AfyaPack/mcp/src/index.js

# Verify connection
claude mcp list
# afyapack: ✓ Connected
```

### Available MCP Tools (13 total)

| Tool | Description |
|---|---|
| `search_protocols` | TF-IDF search across local clinical protocols |
| `create_encounter` | Create a patient encounter with red flag screening |
| `get_guidance` | Generate grounded AI guidance for an encounter |
| `generate_referral` | Create a structured referral handoff note |
| `check_stock` | Query medicine and supply levels |
| `get_system_status` | Check AI model, API, and DB health |
| `ask_foundry` | Direct call to Foundry Local model |
| `ask_ollama` | Direct call to Ollama model |
| `ask_local_model` | Auto-routing to best available model |
| `explain_in_swahili` | Translate/explain clinical content in Swahili |
| `translate_clinical_term` | Bidirectional English↔Swahili medical term lookup |
| `detect_language` | Detect if text is Swahili or English |
| `list_medical_terms` | Return the full medical term dictionary |

### Using AfyaPack through Claude

Once the MCP server is connected, you can ask Claude:

```
"Use search_protocols to find guidance on maternal warning signs"

"Create an encounter for a 3-year-old with fever 39.5°C,
 pulse 130, and convulsions — then get guidance"

"Check stock and tell me what medicines are critically low"

"Explain ORS preparation in Swahili using explain_in_swahili"
```

### MCP Server Architecture

```javascript
// mcp/src/index.js
const server = new McpServer({ name: 'afyapack-mcp', version: '1.0.0' });

// Tools are registered with Zod schema validation
server.tool('search_protocols', description, zodSchema, async (args) => {
  const result = await tool.handler(args);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

// Swahili detection in error handling
const lang = detectSwahili(JSON.stringify(args)) ? 'sw' : 'en';
const errorMsg = lang === 'sw' ? `Hitilafu: ${err.message}` : `Error: ${err.message}`;
```

### Test the MCP Server

```bash
cd mcp
node src/test.js
```

Expected output: **24/24 tests pass** across provider detection, Swahili support, API integration, and full clinical workflow.

---

## Step-by-Step Setup Guide

### Prerequisites

- Node.js 18+ (tested on Node 24.13.0)
- Foundry Local **or** Ollama (at least one required for full AI; app works in demo mode without)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/afyapack.git
cd afyapack
```

### 2. Install all dependencies

```bash
npm run install:all
# Installs root, api/, and web/ dependencies in one command
```

### 3. Configure environment

```bash
# Root .env (already committed with sensible defaults)
cat .env
```

```env
FOUNDRY_ENDPOINT=http://127.0.0.1:54346
FOUNDRY_MODEL=qwen2.5-0.5b-instruct-generic-cpu:4
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=mistral:latest
AFYAPACK_API_PORT=3001
DEFAULT_LANGUAGE=sw
```

The API reads from `api/.env`:

```env
PORT=3001
FOUNDRY_ENDPOINT=http://127.0.0.1:54346
FOUNDRY_MODEL=qwen2.5-0.5b-instruct-generic-cpu:4
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=mistral:latest
```

### 4. Start a local AI model

**Option A: Foundry Local (recommended — lighter weight)**

```bash
# Windows (winget)
winget install Microsoft.FoundryLocal

# Run the model (downloads ~1.5 GB on first run)
foundry model run qwen2.5-0.5b

# Verify
curl http://127.0.0.1:54346/v1/models
```

**Option B: Ollama**

```bash
# Download from https://ollama.com or:
curl -fsSL https://ollama.com/install.sh | sh   # Linux/macOS

ollama pull mistral
# or lighter alternative:
ollama pull qwen2.5:0.5b
```

**Option C: No local AI (demo mode)**

Skip this step. The app runs in demo mode — retrieval and red flag screening still work. AI responses are templated.

### 5. Start the application

```bash
# Both servers together (recommended)
npm run dev

# Output:
# [API] AfyaPack API running at http://localhost:3001
# [WEB] - ready on http://localhost:3000
```

Or start them separately:

```bash
# Terminal 1 — API
cd api && node src/index.js

# Terminal 2 — Web
cd web && npx next dev -p 3000
```

### 6. Verify everything is working

```bash
# Check API health
curl http://localhost:3001/api/health

# Expected response:
{
  "status": "ok",
  "ai": { "ready": true, "provider": "foundry", "model": "qwen2.5-0.5b-..." },
  "db": { "protocol_chunks": 28, "stock_items": 12, "encounters": 2 }
}
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. (Optional) Connect MCP Server to Claude Code

```bash
# Add the MCP server
claude mcp add afyapack node /absolute/path/to/afyapack/mcp/src/index.js \
  --env FOUNDRY_ENDPOINT=http://127.0.0.1:54346 \
  --env AFYAPACK_API_URL=http://localhost:3001 \
  --env DEFAULT_LANGUAGE=sw

# Verify
claude mcp list

# Run end-to-end MCP tests
cd mcp && node src/test.js
```

---

## Environment Configuration

All AI model and endpoint configuration is managed through environment variables, enabling easy switching between Foundry Local, Ollama, or any OpenAI-compatible endpoint:

| Variable | Default | Description |
|---|---|---|
| `FOUNDRY_ENDPOINT` | `http://127.0.0.1:54346` | Foundry Local API URL |
| `FOUNDRY_MODEL` | `qwen2.5-0.5b-instruct-generic-cpu:4` | Model ID for Foundry Local |
| `OLLAMA_ENDPOINT` | `http://localhost:11434` | Ollama API URL |
| `OLLAMA_MODEL` | `mistral:latest` | Model for Ollama |
| `AFYAPACK_API_PORT` | `3001` | API server port |
| `DEFAULT_LANGUAGE` | `sw` | Default response language |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | API URL for Next.js client |

To use a different model or provider, only the `.env` files need to change — no code modification required.

---

## API Reference

Base URL: `http://localhost:3001`

### Health

```
GET /api/health
→ { status, ai: { ready, provider, model }, db: { protocol_chunks, stock_items, encounters } }
```

### Chat (Agentic)

```
POST /api/chat
Body: { message: string, history: Message[] }
→ { reply, citations, escalation_needed, tool_used, language, intent }
```

### Encounters

```
GET  /api/encounters          → list all encounters
GET  /api/encounters/:id      → get single encounter
POST /api/encounters          → create encounter (triggers red flag screening)
PATCH /api/encounters/:id     → update encounter
```

### Guidance

```
GET  /api/guidance/:encounterId  → get existing guidance
POST /api/guidance               → generate grounded guidance for encounter
Body: { encounter_id: string }
```

### Protocols

```
GET  /api/protocols          → list all protocol documents
GET  /api/protocols/:id      → get protocol with all sections
POST /api/protocols/search   → TF-IDF search
Body: { query: string, topK: number }
```

### Referrals

```
GET   /api/referrals/:encounterId  → get existing referral
POST  /api/referrals               → generate referral note
PATCH /api/referrals/:id           → update (save edited note)
```

### Stock

```
GET    /api/stock           → all stock items with is_low / is_out flags
POST   /api/stock           → create item
PATCH  /api/stock/:id       → update item
POST   /api/stock/:id/adjust → adjust quantity by delta
DELETE /api/stock/:id       → remove item
```

---

## Agentic Chat Routing

The `/api/chat` endpoint implements lightweight agentic behavior — automatically routing each message to the right tool before calling the AI:

```javascript
// api/src/routes/chat.js

function detectIntent(message) {
  if (STOCK_PATTERNS.test(message))    return 'stock';
  if (DANGER_PATTERNS.test(message))   return 'screening';
  if (CLINICAL_PATTERNS.test(message)) return 'clinical';
  return 'general';
}

function detectLanguage(message) {
  return SWAHILI_PATTERNS.test(message) ? 'sw' : 'en';
}
```

**Routing decision table:**

| Intent | Tool Called | Context Injected |
|---|---|---|
| `clinical` | `searchProtocols(message, 4)` | Top 4 protocol chunks |
| `stock` | SQLite stock query | Full inventory table |
| `screening` | `searchProtocols(message, 4)` | Top 4 protocol chunks |
| `general` | None | System prompt only |

The system prompt switches between English and Swahili based on language detection. The AI never receives context it wasn't given — preventing hallucination of clinical facts outside the protocol corpus.

---

## Multilingual Support (Swahili)

AfyaPack is designed for East African frontline health workers. Swahili (Kiswahili) is supported throughout:

### Language Detection

```javascript
// mcp/src/swahili.js
const SWAHILI_MARKERS = [
  'homa', 'kuhara', 'mtoto', 'mgonjwa', 'dawa', 'mimba',
  'dalili', 'haraka', 'hatari', 'msaada', 'degedege'
];

function detectSwahili(text) {
  const lower = text.toLowerCase();
  const hits = SWAHILI_MARKERS.filter(word => lower.includes(word));
  return hits.length >= 2;
}
```

### Medical Term Dictionary

```javascript
const MEDICAL_TERMS_SW_EN = {
  'homa': 'fever',
  'kuhara': 'diarrhea',
  'degedege': 'convulsions',
  'kutoweza kunywa': 'unable to drink',
  'macho yaliyozama': 'sunken eyes',
  'ngozi kurudi polepole': 'skin pinch returns slowly',
  'mimba': 'pregnancy',
  'damu nyingi': 'heavy bleeding',
};
```

### Swahili System Prompt

When Swahili is detected, the system prompt switches:

```
Wewe ni AfyaPack, msaidizi wa afya wa AI anayefanya kazi bila mtandao.
Unasaidia wahudumu wa afya wa mstari wa mbele.

KANUNI MUHIMU:
1. Wewe SI daktari. Usiwahi kutoa utambuzi.
2. Toa ushauri kulingana na miongozo ya matibabu iliyotolewa tu.
3. Jibu kwa Kiswahili wazi na rahisi kuelewa.
4. Daima eleza wakati mgonjwa anahitaji kupelekwa hospitali.
```

The MCP server's `explain_in_swahili` tool uses this prompt to explain any clinical content in plain Swahili, making specialist knowledge accessible to community health workers.

---

## Red Flag Screening Engine

Before any AI call, a deterministic rule-based engine screens every patient encounter for critical clinical indicators. This fires instantly — no model inference needed.

```javascript
// web/src/lib/redflags.js + api/src/routes/encounters.js

function screenRedFlags(encounter) {
  const flags = [];

  // Temperature thresholds
  if (temp >= 40.0) flags.push({ severity: 'critical', message: 'Critical fever (≥40°C)', action: 'Test for malaria, assess for meningitis' });
  if (temp >= 39.0) flags.push({ severity: 'high',     message: 'High fever (≥39°C)', action: 'Give paracetamol, assess for malaria' });
  if (temp < 35.5)  flags.push({ severity: 'critical', message: 'Hypothermia (<35.5°C)', action: 'Warm patient, urgent referral' });

  // Pulse thresholds
  if (pulse > 130) flags.push({ severity: 'critical', message: 'Severe tachycardia (>130 bpm)', action: 'Urgent referral' });
  if (pulse > 110) flags.push({ severity: 'high',     message: 'Tachycardia (>110 bpm)', action: 'Assess for dehydration, infection' });
  if (pulse < 50)  flags.push({ severity: 'critical', message: 'Bradycardia (<50 bpm)', action: 'Urgent referral' });

  // Symptom-based critical flags
  const CRITICAL_SYMPTOMS = ['convulsions', 'unconscious', 'unable to breathe', 'degedege'];
  CRITICAL_SYMPTOMS.forEach(sym => {
    if (symptoms.some(s => s.toLowerCase().includes(sym))) {
      flags.push({ severity: 'critical', message: `Danger sign: ${sym}` });
    }
  });

  // Pre-eclampsia pattern (pregnancy-specific)
  if (pregnant && hasHeadache && (hasSwelling || hasVisualDisturbance)) {
    flags.push({ severity: 'critical', message: 'Possible pre-eclampsia', action: 'REFER IMMEDIATELY' });
  }

  return flags;
}
```

Red flags fire on the frontend in real time as the form fills — giving the health worker an alert before they even submit the encounter.

---

## Retrieval Pipeline (TF-IDF RAG)

The retrieval engine is built entirely in JavaScript, with no external dependencies:

### Indexing (at startup)

```javascript
// 1. Ingest protocol documents
PROTOCOLS.forEach(doc => {
  doc.sections.forEach(section => {
    const text = `${doc.title} ${section.heading} ${section.text}`;
    const tokens = tokenize(text);
    // Store tokens in SQLite for IDF computation
    db.prepare('INSERT INTO chunks VALUES (?, ?, ?, ?, ?)').run(...);
  });
});

// 2. Compute IDF across all chunks
const allTokenArrays = chunks.map(c => tokenize(c.content));
const idf = computeIDF(allTokenArrays);
// IDF stored in memory for fast query-time scoring
```

### Query Time

```javascript
function searchProtocols(query, topK = 4) {
  const queryTokens = tokenize(query);
  const queryVector = buildTFIDFVector(queryTokens, idf);

  const scored = chunks.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryVector, chunk.tfidfVector)
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(c => c.score > 0);
}
```

### Corpus

5 clinical protocol documents, 28 indexed chunks:

| Document | Sections | Topics |
|---|---|---|
| Fever and Dehydration in Children | 7 | IMCI, ORT, malaria, paracetamol dosing |
| Maternal Warning Signs | 6 | Pre-eclampsia, PPH, sepsis, antenatal danger signs |
| Referral Triggers | 5 | Decision criteria for referral |
| Community Health Worker Protocols | 5 | First aid, assessment, triage |
| Essential Medicines Guide | 5 | Dosing, storage, dispensing |

---

## Scalability and Deployment

### Current: Single Device

The current setup runs on a single laptop or desktop — ideal for individual health worker use and demonstration.

### Scale 1: Clinic LAN (hub-and-spoke)

One AI inference server (a clinic PC or mini PC) serves multiple tablets over local WiFi:

```
[Clinic Server — runs Foundry Local]
         │
   Local WiFi (no internet needed)
    ┌────┴────┬────────┬────────┐
  [Tab1]   [Tab2]   [Tab3]   [Tab4]
  (phone)  (tablet) (tablet) (laptop)
```

Configuration: Set `FOUNDRY_ENDPOINT` and `AFYAPACK_API_URL` to the server's local IP address on all client devices.

### Scale 2: Docker Compose (containerized)

```yaml
# docker-compose.yml (illustrative)
version: '3.8'
services:
  api:
    build: ./api
    ports:
      - "3001:3001"
    environment:
      - FOUNDRY_ENDPOINT=http://foundry:54346
      - OLLAMA_ENDPOINT=http://ollama:11434
    depends_on:
      - foundry

  web:
    build: ./web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:3001

  foundry:
    image: mcr.microsoft.com/foundry-local:latest
    ports:
      - "54346:54346"
    volumes:
      - foundry-models:/models

volumes:
  foundry-models:
```

This configuration:
- Isolates each service in its own container
- Makes the AI model replaceable by swapping the `foundry` service
- Enables deployment to a clinic server, Raspberry Pi cluster, or edge compute node
- Maintains complete air-gap capability — no external registry calls at runtime

### Scale 3: Regional Health Network

```
[District Health Office Server]
     │ (VPN or satellite when available)
     ├── Protocol updates pushed to all clinics
     └── Anonymized aggregate statistics synced

[Clinic A Server] ── [Clinic A tablets ×4]
[Clinic B Server] ── [Clinic B tablets ×6]
[Clinic C Server] ── [Clinic C tablets ×2]
```

The offline-first design means each clinic operates independently. Sync happens opportunistically when connectivity is available.

### Database Scalability

The current `sql.js` (WASM SQLite) implementation is designed for single-device use. For multi-device or multi-clinic deployments:

| Scale | Recommended DB | Migration effort |
|---|---|---|
| Single device | sql.js (current) | None |
| Clinic LAN | libsql / Turso | Change `getDB()` adapter |
| Regional network | PostgreSQL + edge sync | Replace `getDB()` + add sync queue |

The sync queue infrastructure already exists: `IndexedDB` in the browser stores an `offline_queue` of actions to replay when a connection is available.

---

## Containerization Strategy

### Why Foundry Local enables containerization

Traditional local AI deployments require complex native dependencies, CUDA drivers, or platform-specific builds. Foundry Local's architecture separates concerns cleanly:

```
┌─────────────────────────────────────────┐
│              Your Application           │
│  (Node.js, Python, .NET — any runtime)  │
│                                         │
│   HTTP POST /v1/chat/completions        │
└─────────────────┬───────────────────────┘
                  │ localhost:54346
┌─────────────────▼───────────────────────┐
│           Foundry Local Runtime         │
│  - Model management                     │
│  - Quantization / hardware selection    │
│  - OpenAI-compat API server             │
│  - CPU/GPU dispatch                     │
└─────────────────────────────────────────┘
```

Because the interface is a simple HTTP API, the application container needs **zero AI-specific dependencies**. It's a standard Node.js container that makes HTTP requests. The AI runtime is a separate sidecar.

This means:
- Application containers are tiny (~200 MB) and rebuild fast
- Model updates don't require application redeployment
- The same container image runs on Windows, macOS, and Linux
- CI/CD pipelines test the application without running the AI model

### Progressive Web App (PWA)

AfyaPack includes PWA manifest configuration, enabling installation on Android and iOS from the browser:

```json
// public/manifest.json
{
  "name": "AfyaPack Health Assistant",
  "short_name": "AfyaPack",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#16A394",
  "background_color": "#F2F4F8",
  "icons": [...]
}
```

When installed as a PWA:
- Launches in full-screen mode without browser chrome
- Can be added to home screen on Android/iOS
- Service worker caches the app shell for offline access
- IndexedDB persists data between sessions

---

## Mobile Strategy

AfyaPack is designed mobile-first, not mobile-adapted:

### Responsive layout

- **≥1280px (xl):** Three-panel layout — nav rail + content + right context panel
- **≥1024px (lg):** Two-panel — nav rail + content
- **<1024px (mobile):** Single column + fixed bottom navigation bar

### Mobile-specific UI decisions

| Decision | Rationale |
|---|---|
| Fixed bottom nav (5 items) | Thumb-reachable on phones |
| Chat CTA as primary bottom nav item | Most-used feature is always one tap away |
| Sticky chat composer at bottom | Mirrors WhatsApp/SMS pattern familiar to users |
| Voice input in composer | Faster than typing on phone keyboard |
| Symptom chips (tap-to-add) | Avoids keyboard for most common inputs |
| Full-screen loading states | Prevents confusion during AI inference |
| 44px minimum touch targets | Accessibility and field usability |

### Voice Input

The `ChatComposer` component uses the Web Speech API for voice transcription:

```javascript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = true;
recognition.onresult = (event) => {
  const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
  setText(transcript);  // Shows live transcription in the input
};
```

Supported on: Chrome for Android, Samsung Internet, Safari 14.1+, Chrome desktop. Falls back gracefully (microphone button hidden if not supported).

---

## How We Built AfyaPack with AI

AfyaPack was built using AI assistance throughout the development process — from architecture decisions to code generation to debugging. Here is an honest account of how AI was used and what we learned.

### Tools used

| Tool | How it was used |
|---|---|
| **Claude Code (Claude Sonnet 4.6)** | Primary development assistant — architecture, all code generation, debugging |
| **VS Code AI Toolkit** | Model evaluation, inference playground, endpoint configuration |
| **Foundry Local** | Runtime for the AI model powering the product itself |
| **GitHub Copilot** | Inline completions during manual editing |

### The development workflow

The entire project was scaffolded, built, and iterated through a conversation-driven development loop:

1. **Architecture design through prompting:** We described the problem, constraints, and technical requirements in a detailed prompt. Claude proposed the architecture — sql.js over better-sqlite3, TF-IDF over vector embeddings, provider waterfall pattern — and justified each choice.

2. **Incremental code generation:** Each module was generated with a prompt describing exactly what it needed to do, its inputs, outputs, and constraints. The AI generated working code that was then verified against the running system.

3. **Debugging through conversation:** When native SQLite compilation failed on Node 24, we described the error to Claude, which identified the EBUSY file lock issue, proposed the sql.js alternative, and generated the compatibility shim.

4. **Redesign through specification:** The full UI redesign was triggered by a single comprehensive design brief. All 10 phases (design system, layout, dashboard, chat, encounter flow, guidance, stock, protocols, settings, polish) were executed sequentially by the AI.

5. **Test-driven iteration:** The MCP test suite (24 tests) was generated first, then the implementation was built to pass it.

---

## Prompts and Prompt Engineering

### Prompt strategy: context-dense specification

The most effective prompts for code generation in this project were structured as:

```
[WHAT IT IS]: One sentence describing the module's identity
[WHAT IT DOES]: Input → processing → output
[CONSTRAINTS]: Hard requirements (no external deps, must handle X, must return Y)
[CONTEXT]: What exists that this integrates with
[EDGE CASES]: Failure modes to handle
```

### Example: The system prompt for clinical guidance

This prompt is sent to the local AI model with every guidance generation request. It took several iterations to get right:

```
You are AfyaPack, a protocol-based clinical decision support tool for frontline health workers.

CRITICAL RULES:
1. You are NOT a diagnostic tool. Never state a diagnosis.
2. Base your guidance ONLY on the protocol excerpts provided. Do not use outside knowledge.
3. Always include a clear safety note that this is decision support only.
4. Always state when referral or escalation is needed.
5. Cite which protocol source(s) your guidance is based on.
6. Use plain, clear language appropriate for frontline workers.
7. If the retrieved protocols do not cover the presentation, explicitly say so.

RESPONSE FORMAT:
**Assessment Context**
[Brief 1-2 sentence summary of the key clinical picture]

**Protocol-Based Guidance**
[Numbered list of recommended actions based ONLY on retrieved protocols]

**When to Refer/Escalate**
[Clear conditions that require referral, based on protocols]

**Sources Used**
[List the protocol titles cited, numbered]

**Safety Note**
⚠️ This is protocol-based decision support only.
```

**What we learned about this prompt:**
- Explicit format instructions ("RESPONSE FORMAT") dramatically improved consistency across different models
- The "ONLY on protocol excerpts" constraint was essential — without it, the 0.5B model would sometimes produce plausible-but-wrong clinical advice
- Low temperature (0.2–0.25) for clinical responses reduced variation and hallucination
- The safety note at the end became a parsing anchor for the frontend

### Example: Swahili language switching

The language-switching prompt was generated with this specification:

```
Build a language detection function that:
- Takes a string of text
- Returns 'sw' if it's Swahili, 'en' otherwise
- Uses heuristic matching on a curated word list (not an ML model)
- Must work offline without any API call
- Should handle mixed-language input gracefully
- Clinical Swahili words to target: homa, kuhara, degedege, mimba, dalili
- False positive rate must be very low for English text
```

The resulting function checks for ≥2 Swahili marker word hits — a simple but highly reliable heuristic for this domain.

### Example: The agentic routing prompt

The intent detection system was specified as:

```
Build a lightweight intent router that:
- Takes a user message string
- Returns one of: 'clinical', 'stock', 'screening', 'general'
- Uses regex pattern matching (not an LLM call) — must be <1ms
- 'clinical': mentions symptoms, vitals, protocols, treatments
- 'stock': mentions medicines, supplies, inventory, running out
- 'screening': mentions danger, urgent, emergency, referral
- 'general': everything else
- Must handle Swahili keywords in each category
```

This zero-latency routing layer means the AI is only called once per message, with the right context pre-assembled.

### Prompts that didn't work

**Too vague:** `"Build the TF-IDF retrieval engine"` — resulted in a correct but non-integrated implementation that required significant rework.

**Too prescriptive on implementation:** `"Use a Map object with string keys for the TF-IDF vectors"` — the AI followed the instruction but the resulting code was harder to optimize. Describing the *behaviour* rather than the *implementation* produced better results.

**Missing constraints:** Early guidance prompts didn't include the "ONLY use retrieved protocols" constraint, leading to responses that mixed retrieved facts with model-internal knowledge.

### What we learned about prompting for healthcare AI

1. **Safety constraints must be explicit and repeated** — the model cannot infer that clinical hallucination is unacceptable. State it in the system prompt, state it in the user prompt, and validate the output.

2. **Format instructions are load-bearing** — structured output (numbered sections, bold headings) is both more readable for the user AND easier to parse programmatically.

3. **Temperature matters more than model size** — `qwen2.5-0.5b` at temperature 0.2 with a strict system prompt outperformed larger models at temperature 0.7 for consistent clinical formatting.

4. **Retrieval quality > model quality** — a good TF-IDF retrieval with the right 4 protocol chunks produces better guidance than a larger model with no grounding.

---

## Responsible AI Design

AfyaPack was designed with responsible AI principles from the ground up:

### Non-diagnostic by design

Every component reinforces the same message:
- System prompt explicitly prohibits diagnosis
- Frontend shows "decision support only" on every guidance page
- Safety note is extracted and displayed separately at the bottom
- Red flag banners say "clinical alerts" not "diagnoses"
- Referral notes say "clinical concern" not "diagnosis"

### Grounded responses

The AI cannot answer outside its protocol corpus. If no relevant protocol chunks are retrieved, the response explicitly states: *"The retrieved protocols do not cover this presentation."*

### Citation transparency

Every AI response shows which protocol sections were used. Users can see the exact source text. If the AI is wrong, the citation shows the user where to verify.

### Local data sovereignty

No patient data leaves the device. All storage is:
- SQLite on the local filesystem (`afyapack.db`)
- IndexedDB in the browser (drafts, offline queue)
- No telemetry, no analytics, no cloud sync

### Escalation first

The rule-based red flag engine fires before the AI. Critical danger signs produce immediate escalation alerts regardless of what the AI says. The AI cannot override a critical flag.

---

## Project Structure

```
afyapack/
├── api/                          # Express backend
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.js          # sql.js wrapper (better-sqlite3 compat API)
│   │   │   └── seed.js           # Protocol ingestion + demo data
│   │   ├── routes/
│   │   │   ├── chat.js           # POST /api/chat — agentic routing
│   │   │   ├── encounters.js     # Patient encounter CRUD + red flag screening
│   │   │   ├── guidance.js       # AI guidance generation (RAG)
│   │   │   ├── referrals.js      # Referral note generation
│   │   │   ├── protocols.js      # Protocol CRUD + TF-IDF search
│   │   │   ├── stock.js          # Stock management
│   │   │   └── health.js         # Health check
│   │   ├── services/
│   │   │   ├── foundry.js        # AI provider (Foundry → Ollama → Mock)
│   │   │   ├── retrieval.js      # TF-IDF engine
│   │   │   └── prompts.js        # System prompt builders
│   │   └── index.js              # App entrypoint
│   └── .env
│
├── web/                          # Next.js 14 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.js           # Dashboard
│   │   │   ├── chat/page.js      # AI Chat interface
│   │   │   ├── encounter/page.js # Triage wizard
│   │   │   ├── guidance/[id]/    # Clinical guidance
│   │   │   ├── referral/[id]/    # Referral notes
│   │   │   ├── stock/page.js     # Stock tracker
│   │   │   ├── protocols/page.js # Protocol library
│   │   │   ├── settings/page.js  # System status
│   │   │   ├── globals.css       # Design system
│   │   │   └── layout.js         # Root layout
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatComposer.jsx  # Input with voice
│   │   │   │   ├── ChatMessage.jsx   # Message renderer
│   │   │   │   └── WelcomeState.jsx  # Empty state + prompts
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── BottomNav.jsx
│   │   │   │   └── RightPanel.jsx
│   │   │   ├── EncounterForm.jsx     # 4-step triage wizard
│   │   │   ├── RedFlagBanner.jsx     # Clinical alert display
│   │   │   ├── GuidanceDisplay.jsx   # Guidance markdown renderer
│   │   │   └── CitationCard.jsx      # Protocol source cards
│   │   ├── hooks/
│   │   │   ├── useSystemStatus.js    # Polls /api/health every 30s
│   │   │   └── useOfflineStatus.js   # navigator.onLine events
│   │   └── lib/
│   │       ├── api.js               # API client
│   │       ├── redflags.js          # Client-side red flag screening
│   │       ├── db.js                # IndexedDB (drafts, offline queue)
│   │       └── utils.js             # Date, patient, symptom utils
│   └── tailwind.config.js
│
├── mcp/                          # Model Context Protocol server
│   ├── src/
│   │   ├── index.js              # MCP server (stdio transport)
│   │   ├── swahili.js            # Language detection + dictionary
│   │   ├── providers/
│   │   │   ├── foundry.js        # Foundry Local provider
│   │   │   ├── ollama.js         # Ollama provider
│   │   │   └── router.js         # Provider auto-selection
│   │   ├── tools/
│   │   │   ├── afyapack.js       # AfyaPack API tools
│   │   │   ├── ask-model.js      # Direct model tools
│   │   │   └── swahili-tools.js  # Swahili language tools
│   │   └── test.js               # 24-test end-to-end suite
│   └── claude_config.json        # Claude Desktop MCP config
│
├── .env                          # Root environment config
├── package.json                  # Root scripts (concurrently)
└── README.md
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend framework** | Next.js 14 (App Router) | React server components, file-based routing, PWA support |
| **Styling** | Tailwind CSS + custom design system | Utility-first, no runtime overhead |
| **Animations** | Framer Motion | Smooth transitions without fighting CSS |
| **UI primitives** | Radix UI (unstyled) | Accessible, headless, fully customizable |
| **Icons** | Lucide React | Consistent, tree-shakable, 1000+ icons |
| **Typography** | Plus Jakarta Sans + Inter (Google Fonts) | Premium feel, wide language support |
| **Backend** | Node.js + Express | JavaScript everywhere, minimal overhead |
| **Database** | sql.js (WASM SQLite) | No native compilation — runs on Node 24, any OS |
| **Browser storage** | IndexedDB via `idb` | Offline queue, drafts, UI state |
| **Local AI (primary)** | Foundry Local + qwen2.5-0.5b | On-device, CPU-only, OpenAI-compat API |
| **Local AI (fallback)** | Ollama + mistral:latest | Broader model choice, same API |
| **Retrieval** | Custom TF-IDF in JavaScript | Zero dependencies, < 5ms, fully offline |
| **MCP** | `@modelcontextprotocol/sdk` | Expose tools to Claude and AI assistants |
| **Voice input** | Web Speech API | No library needed, works on Android/Chrome |
| **Concurrency** | `concurrently` | Single `npm run dev` starts both servers |

---

*AfyaPack was built for the Microsoft JavaScript AI Build-a-thon.*
*All patient data is stored locally. No data is transmitted to external servers.*
*This tool is clinical decision support only. It does not diagnose.*
