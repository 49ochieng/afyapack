# Lesson 00: Introduction — What We're Building

> Understand the vision before writing a single line of code.

---

## Lesson Overview

| | |
|---|---|
| **Duration** | 15 minutes |
| **Objective** | Understand what AfyaPack does and why it matters |
| **Output** | Mental model of the app, motivation to build it |
| **Prerequisites** | None |

---

## The Mission

Imagine you're a health worker in a remote clinic in rural Kenya. 

A mother walks in with her 2-year-old child. The child has:
- High fever (39.5°C)
- Diarrhea for two days
- Unable to drink fluids

You need to:
1. **Assess** — Is this an emergency? What danger signs should you check?
2. **Treat** — What do the clinical protocols recommend?
3. **Refer** — Does this child need to go to a hospital?

You have no internet. You can't call a specialist. But you have your phone — and now, you have **AfyaPack**.

---

## What AfyaPack Does

AfyaPack is an **AI-powered clinical decision support app** that:

| Feature | What it does |
|---------|--------------|
| **AI Chat** | Answer clinical questions using local AI, grounded in protocols |
| **Triage Flow** | 4-step patient assessment with live danger sign detection |
| **Protocol Grounding** | Every AI response cites specific clinical guidelines |
| **Red Flag Engine** | Rule-based alerts for critical danger signs |
| **Referral Notes** | Generate structured handoff documents |
| **Stock Tracking** | Monitor medicine inventory |
| **Swahili Support** | Auto-detects language and adapts |

**And the best part:** It all runs **100% offline**. No internet required.

---

## The Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     WHAT YOU'LL BUILD                       │
├─────────────────────┬───────────────────┬───────────────────┤
│     FRONTEND        │     BACKEND       │    LOCAL AI       │
│     Next.js 14      │     Express.js    │    Foundry Local  │
│     Tailwind CSS    │     SQLite        │    Qwen 2.5       │
│     React           │     Node.js       │    TF-IDF Search  │
└─────────────────────┴───────────────────┴───────────────────┘

Tools you'll use:
• GitHub Copilot — Your AI pair programmer
• Foundry Local — Local AI inference engine
• VS Code — Your editor
```

---

## Why Foundry Local?

Foundry Local lets you run AI models directly on your machine.

| Cloud AI | Local AI (Foundry Local) |
|----------|--------------------------|
| Requires internet | Works offline |
| Data sent to servers | Data stays on device |
| Pay per request | No API costs |
| Network latency | Instant local inference |
| Model may change | Model is consistent |

For healthcare data, **privacy matters**. Local AI means patient information never leaves the device.

---

## Why GitHub Copilot?

Copilot is an AI pair programmer that suggests code as you type.

**In this lab, you'll learn to:**
- Write prompts that generate useful code
- Recognize when Copilot's output needs editing
- Use Copilot Chat for architecture discussions
- Build faster without sacrificing understanding

> **The skill you'll take away:** Knowing how to prompt AI tools effectively will make you a more productive developer for the rest of your career.

---

## What Makes This App Impressive

When you finish, you'll have an app that:

1. **Looks professional** — Polished UI with animations, responsive design
2. **Works reliably** — Grounded AI, never hallucinates arbitrary medical facts
3. **Handles safety correctly** — Critical danger signs trigger deterministic rules
4. **Supports multiple languages** — English and Swahili
5. **Runs anywhere** — No server required, works on any device

This isn't a toy demo. This is a production-quality app.

---

## The Learning Journey

```
Phase 1: Foundation
├── Lesson 00: Introduction (you are here)
├── Lesson 01: Setup & Environment
└── Lesson 02: Foundry Local

Phase 2: Backend
├── Lesson 03: Project Scaffolding
├── Lesson 04: Backend API
└── Lesson 05: Foundry Integration

Phase 3: Intelligence
├── Lesson 06: Chat Experience
├── Lesson 07: Retrieval & Grounding
├── Lesson 08: Encounter Triage
└── Lesson 09: Red Flag Engine

Phase 4: Polish
├── Lesson 10: Stock Tracking
├── Lesson 11: Multilingual Support
├── Lesson 12: UI Polish
└── Lesson 13: Testing & Demo
```

By the end, you'll have built something you're proud to show.

---

## Before You Start

Take a moment to think about:

1. **Who is this for?** Frontline health workers with limited resources.
2. **Why offline?** Because internet isn't always available.
3. **Why grounding?** Because AI can hallucinate, and healthcare is safety-critical.
4. **Why local AI?** Because patient data is private.

Every technical decision we make should connect back to these needs.

---

## Demo: The Finished App

Before you start building, let's see the finished product.

### 1. Dashboard
- Shows AI status (local model ready)
- Quick stats (protocols loaded, stock alerts)
- One-tap access to chat

### 2. Chat Interface
- Type a question in English or Swahili
- AI responds with protocol-grounded guidance
- Citations show which protocols were used

### 3. Triage Flow
- 4-step patient assessment form
- Live danger sign detection as you type
- Generates AI guidance with sources

### 4. Red Flag Alerts
- Rule-based screening
- Fires before any AI is called
- Critical signs trigger URGENT REFERRAL

---

## Reflection Questions

Before moving on, consider:

1. What would happen if the AI gave wrong medical advice?
2. Why do we use rules (not AI) for danger sign detection?
3. What's the benefit of citing specific sources in AI responses?
4. How does offline capability change the design constraints?

---

## Next Step

**Proceed to Lesson 01:** Setup & Environment

You'll install all the tools needed to build AfyaPack.

---

## Vocabulary

| Term | Definition |
|------|------------|
| **Foundry Local** | Microsoft's local AI inference runtime |
| **Grounding** | Constraining AI responses to specific documents |
| **RAG** | Retrieval-Augmented Generation — giving AI relevant context |
| **Red flag** | A clinical danger sign requiring immediate action |
| **TF-IDF** | Term Frequency-Inverse Document Frequency — a text similarity method |

---

*Ready to build something amazing? Let's go. →*
