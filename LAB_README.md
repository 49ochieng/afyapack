# AfyaPack — Build Your Own AI Health Assistant

> **A hands-on lab experience for Microsoft events**  
> **Build an offline-first AI app using Foundry Local + GitHub Copilot**

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                    │
│   🏥  AfyaPack: AI Health Decision Support                        │
│                                                                    │
│   ✅ Runs 100% offline — No internet required                     │
│   ✅ Local AI inference — Your data never leaves your device      │
│   ✅ Protocol-grounded — Citations from real clinical guidelines  │
│   ✅ Multilingual — English and Swahili (Kiswahili) support       │
│   ✅ Production-ready UI — Premium, mobile-first design           │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎯 What You'll Build

By the end of this lab, you'll have built **AfyaPack** — a complete AI health decision support app that runs entirely on your local machine. This is exactly the kind of app that could help a frontline health worker in a remote clinic make better decisions, faster, without needing an internet connection.

**Your final app will include:**

| Feature | What it does |
|---------|--------------|
| **AI Chat Interface** | Natural language Q&A grounded in clinical protocols |
| **Patient Encounter Triage** | 4-step structured assessment with live danger sign detection |
| **Protocol-Grounded Guidance** | AI responses cite specific clinical guidelines |
| **Red Flag Screening Engine** | Rule-based alerts fire before AI — instant critical warnings |
| **Referral Note Generator** | AI writes structured handoff notes |
| **Stock Tracker** | Medicine inventory with low-stock alerts |
| **Swahili Support** | Auto-detects language and adapts the UI and prompts |

**And you'll learn:**
- How to use **Foundry Local** for private, offline AI inference
- How to use **GitHub Copilot** effectively to build real applications
- How to **engineer prompts** that produce reliable, grounded outputs
- How to build **retrieval-augmented generation (RAG)** from scratch
- How to design **safety-first AI** for sensitive domains like healthcare

---

## 🌍 The Scenario

*Imagine you're building for a frontline health worker in rural Kenya.*

She works at a small clinic with unreliable electricity, no internet, and limited supplies. A mother walks in with a 2-year-old child — high fever, diarrhea, unable to drink. The health worker needs to:

1. **Assess** — Is this an emergency? What danger signs should she check?
2. **Treat** — What do the clinical protocols recommend?
3. **Refer** — Does this child need to go to a hospital? What information does the receiving doctor need?

She can't search the internet. She can't call a specialist. But she has her phone — and now, she has **AfyaPack**.

**This is what you're building.** An AI assistant that:
- Works with zero connectivity
- Grounds every answer in real clinical protocols
- Screens for danger signs automatically
- Speaks her language

Every architectural choice you'll make connects back to this mission.

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         AFYAPACK ARCHITECTURE                            │
├────────────────────┬────────────────────┬────────────────────────────────┤
│    FRONTEND        │    BACKEND         │    LOCAL AI LAYER              │
│    Next.js 14      │    Express.js      │                                │
│    Tailwind CSS    │    SQLite (WASM)   │    ┌─────────────────────┐     │
│    Framer Motion   │                    │    │   Foundry Local     │     │
│    Port 3000       │    Port 3001       │    │   Qwen 2.5 (0.5B)   │     │
│                    │                    │    │   Port 54346        │     │
│  ┌──────────────┐  │  ┌──────────────┐  │    └──────────┬──────────┘     │
│  │ Dashboard    │  │  │ /api/chat    │  │               │                │
│  │ Chat UI      │◄─┤  │ /api/guidance│  │    ┌──────────▼──────────┐     │
│  │ Encounter    │  │  │ /api/referral│  │    │   TF-IDF Retrieval  │     │
│  │ Stock        │  │  │ /api/stock   │  │    │   Protocol Search   │     │
│  │ Protocols    │  │  │ /api/protocols│ │    │   28 chunks / 5 docs│     │
│  └──────────────┘  │  └──────────────┘  │    └─────────────────────┘     │
│                    │                    │                                │
│  IndexedDB         │  SQLite            │    OpenAI-compatible API       │
│  (offline queue)   │  (encounters,      │    (chat/completions)          │
│                    │   protocols,       │                                │
│                    │   referrals)       │                                │
└────────────────────┴────────────────────┴────────────────────────────────┘
```

**Key design decisions you'll understand:**

| Decision | Why |
|----------|-----|
| **Foundry Local** | Privacy-preserving local inference. Data never leaves the device. |
| **Small Model (0.5B)** | Runs on any hardware. Trades capability for accessibility. |
| **TF-IDF Retrieval** | Works offline. No embedding API needed. Deterministic results. |
| **SQLite via WASM** | No database server. Embedded directly in the app. |
| **Rule-based Red Flags** | Critical safety logic should be deterministic, not probabilistic. |

---

## 📚 Lab Structure

This lab is organized as a progressive learning journey. Each lesson builds on the previous one.

```
AfyaPack/
├── labs/                    # 👈 Start here! The learning journey
│   ├── 00-introduction/
│   ├── 01-setup/
│   ├── 02-foundry-local/
│   ├── 03-project-scaffold/
│   ├── 04-backend-api/
│   ├── 05-foundry-integration/
│   ├── 06-chat-experience/
│   ├── 07-retrieval-grounding/
│   ├── 08-encounter-triage/
│   ├── 09-red-flag-engine/
│   ├── 10-stock-tracking/
│   ├── 11-multilingual-support/
│   ├── 12-ui-polish/
│   └── 13-testing-demo/
│
├── prompts/                 # Copilot prompt library — copy-paste ready
├── starter/                 # Clean starting points for each major phase
├── checkpoints/             # Recovery points — catch up if you fall behind
├── final/                   # The complete finished app
│
├── docs/                    # Deep-dive documentation
│   ├── SETUP.md            # Installation and prerequisites
│   ├── INSTRUCTOR.md       # For facilitators running this lab
│   ├── ARCHITECTURE.md     # Technical deep-dive
│   ├── RESPONSIBLE_AI.md   # Safety and ethics
│   └── TROUBLESHOOTING.md  # Common issues and fixes
│
├── api/                     # Express.js backend (final code)
├── web/                     # Next.js frontend (final code)
└── mcp/                     # MCP server for Claude integration
```

---

## ⏱️ Estimated Time

| Section | Time | What you'll accomplish |
|---------|------|------------------------|
| **Setup & Foundry Local** | 30 min | Install tools, run local AI |
| **Project Scaffolding** | 20 min | Create project structure with Copilot |
| **Backend API** | 40 min | Build Express routes, SQLite database |
| **AI Integration** | 30 min | Connect to Foundry Local, build prompts |
| **Chat Experience** | 30 min | Build the conversational UI |
| **Retrieval & Grounding** | 30 min | Implement TF-IDF search, add citations |
| **Encounter & Safety** | 30 min | Build triage flow, red flag engine |
| **Polish & Demo** | 20 min | Final UI touches, demo walkthrough |
| **Total** | ~4 hours | Complete working app |

---

## 🛠️ Prerequisites

Before starting, ensure you have:

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | ≥18.x | JavaScript runtime |
| **npm** | ≥9.x | Package manager |
| **Git** | Any | Version control |
| **VS Code** | Latest | Editor |
| **GitHub Copilot** | Active subscription | AI pair programmer |
| **Foundry Local** | Latest | Local AI inference |

See [docs/SETUP.md](docs/SETUP.md) for detailed installation instructions.

---

## 🚀 Quick Start

If you just want to run the final app immediately:

```powershell
# Clone the repository
git clone https://github.com/microsoft/afyapack.git
cd afyapack

# Install all dependencies
npm run install:all

# Start Foundry Local (in a separate terminal)
foundry local start

# Start the app
npm run dev
```

Open http://localhost:3000 — you should see AfyaPack ready to use.

---

## 🎓 Learning Path

### Phase 1: Foundation
**Lessons 00–02** — Understand the vision, set up your environment, and get Foundry Local running.

### Phase 2: Backend
**Lessons 03–05** — Scaffold the project, build the API, connect to local AI.

### Phase 3: Intelligence
**Lessons 06–09** — Build the chat UI, add retrieval, implement safety features.

### Phase 4: Polish
**Lessons 10–13** — Add stock tracking, multilingual support, and final UI polish.

Each lesson includes:
- **Objective** — What you'll learn and build
- **Duration** — Expected time to complete
- **Prerequisites** — What should already be working
- **Copilot Prompts** — Exact prompts to use, with explanations
- **Validation** — How to verify you did it correctly
- **Stretch Goals** — Extra challenges if you have time

---

## 🤖 About Foundry Local

**Foundry Local** is Microsoft's local AI inference runtime. It lets you run AI models directly on your machine — no cloud API, no internet required, complete privacy.

**Why Foundry Local for this lab?**

| Benefit | For AfyaPack |
|---------|--------------|
| **Privacy** | Patient data never leaves the device |
| **Offline** | Works in remote clinics with no internet |
| **Speed** | No network latency for inference |
| **Cost** | No API charges per request |
| **Control** | Deterministic, reproducible behavior |

Foundry Local exposes an **OpenAI-compatible API**, so the same code that calls OpenAI can call your local model — just change the endpoint.

```javascript
// Works with both OpenAI and Foundry Local
const response = await fetch(`${endpoint}/v1/chat/completions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'qwen2.5-0.5b-instruct-generic-cpu:4',
    messages: [{ role: 'user', content: 'Hello' }],
  }),
});
```

---

## 🧑‍💻 About GitHub Copilot

This lab is designed to be built **with GitHub Copilot as your AI pair programmer**. You won't just type code — you'll learn to prompt effectively.

**What you'll practice:**

| Skill | Example |
|-------|---------|
| **Scaffolding prompts** | "Create an Express router for patient encounters with CRUD endpoints" |
| **Architectural prompts** | "Design a TF-IDF retrieval system that works entirely offline" |
| **Refinement prompts** | "Add error handling and input validation to this route" |
| **Debugging prompts** | "The CORS preflight is failing — suggest fixes" |
| **Polish prompts** | "Make this UI component animate smoothly with Framer Motion" |

Every major build step includes **ready-to-use prompts** in the [prompts/](prompts/) directory.

---

## ⚠️ Responsible AI

This is a healthcare-adjacent application. The teaching materials emphasize:

1. **Decision support, not diagnosis** — The AI assists, it never replaces clinical judgment
2. **Grounding** — Every response cites specific protocol sources
3. **Deterministic safety** — Critical danger signs trigger rule-based alerts, not AI predictions
4. **Transparency** — The UI always shows what the AI cannot do
5. **Local data** — Patient information never leaves the device

See [docs/RESPONSIBLE_AI.md](docs/RESPONSIBLE_AI.md) for the full framework.

---

## 📬 Support

- **Lab issues?** Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- **Copilot not working?** Ensure your subscription is active and you're signed in
- **Foundry Local issues?** Run `foundry local status` to check model availability
- **Behind schedule?** Use the [checkpoints/](checkpoints/) folder to catch up

---

## 🏆 What Success Looks Like

By the end of this lab, you should be able to:

✅ Explain why local AI inference matters for privacy-sensitive applications  
✅ Set up and use Foundry Local for local model inference  
✅ Use GitHub Copilot to scaffold and build a full-stack application  
✅ Engineer prompts that produce grounded, safe AI responses  
✅ Implement retrieval-augmented generation without external APIs  
✅ Build a production-quality UI that works offline  
✅ Articulate the responsible AI principles behind your design choices  

**And you'll walk away with a complete, working app that you built yourself.**

---

*Built with ❤️ for Microsoft developer events.*  
*Empowering frontline health workers, one offline AI assistant at a time.*
