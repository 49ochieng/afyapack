# Instructor Guide — AfyaPack Lab

> For facilitators running the AfyaPack hands-on lab at Microsoft events.

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Event Preparation](#pre-event-preparation)
3. [Venue Setup Checklist](#venue-setup-checklist)
4. [Session Pacing](#session-pacing)
5. [Live Demo Script](#live-demo-script)
6. [Teaching Checkpoints](#teaching-checkpoints)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [Catching Up Slow Learners](#catching-up-slow-learners)
9. [Key Talking Points](#key-talking-points)
10. [Post-Lab Resources](#post-lab-resources)

---

## Overview

**AfyaPack** is a hands-on lab that teaches:
- Local AI inference with **Foundry Local**
- Effective use of **GitHub Copilot**
- **Prompt engineering** for reliable AI outputs
- Building a complete **offline-first AI application**
- **Responsible AI** principles for healthcare applications

**Target Audience:** Developers with basic JavaScript/TypeScript knowledge  
**Session Length:** 3-4 hours (adjustable)  
**Format:** Live coding with Copilot, checkpoint recovery, demo moments

---

## Pre-Event Preparation

### 2 Weeks Before

- [ ] Test the complete lab on the same hardware attendees will use
- [ ] Verify Foundry Local installation process works reliably
- [ ] Prepare USB drives with:
  - Pre-downloaded AI models
  - npm package cache (optional)
  - Complete solution code
- [ ] Confirm venue WiFi can handle GitHub Copilot connections
- [ ] Prepare fallback plans for offline scenarios

### 1 Day Before

- [ ] Test setup on venue machines (if using lab computers)
- [ ] Pre-install Node.js, Git, VS Code on all machines
- [ ] Pre-load Foundry Local and models
- [ ] Test Copilot authentication with a sample account
- [ ] Prepare printed "cheat sheets" for common issues
- [ ] Brief teaching assistants on the flow

### Morning Of

- [ ] Start all Foundry Local instances early (saves time)
- [ ] Clone the repo on all machines
- [ ] Run `npm run install:all` on all machines
- [ ] Open VS Code with the project ready
- [ ] Test one full chat request to warm up the model

---

## Venue Setup Checklist

### Power
- [ ] Every seat has a power outlet
- [ ] Extension cords available for high-density seating
- [ ] Backup power for instructor machine

### Network
- [ ] WiFi tested with 50+ concurrent devices
- [ ] Fallback: personal hotspot or wired connection
- [ ] GitHub Copilot requires internet (ensure connectivity)

### Displays
- [ ] Projector/screen visible from all seats
- [ ] Font size at minimum 18pt for code visibility
- [ ] Dark theme recommended for projection

### Software Pre-Loaded
- [ ] Node.js 18+ on all machines
- [ ] VS Code with Copilot extensions
- [ ] Foundry Local installed and model downloaded
- [ ] Git installed and configured

---

## Session Pacing

### 4-Hour Session (Full)

| Time | Duration | Section | What Happens |
|------|----------|---------|--------------|
| 0:00 | 15 min | **Welcome & Demo** | Show the finished app, get people excited |
| 0:15 | 15 min | **Setup Verification** | Ensure everyone's environment works |
| 0:30 | 20 min | **Foundry Local Intro** | Explain local AI, test the endpoint |
| 0:50 | 30 min | **Project Scaffolding** | Create project structure with Copilot |
| 1:20 | 10 min | **Break** | Catch up slower learners |
| 1:30 | 40 min | **Backend API** | Build Express routes, SQLite database |
| 2:10 | 30 min | **AI Integration** | Connect Foundry Local, build prompts |
| 2:40 | 10 min | **Break** | Checkpoint recovery time |
| 2:50 | 30 min | **Chat Experience** | Build the chat UI |
| 3:20 | 25 min | **Retrieval & Grounding** | TF-IDF search, citations |
| 3:45 | 15 min | **Wrap-Up & Demo** | Show what we built, Q&A |

### 2-Hour Session (Abbreviated)

| Time | Duration | Section |
|------|----------|---------|
| 0:00 | 10 min | Welcome & Finished App Demo |
| 0:10 | 10 min | Setup Verification |
| 0:20 | 15 min | Foundry Local Quick Start |
| 0:35 | 25 min | Backend API (use starter code) |
| 1:00 | 25 min | AI Integration & Chat |
| 1:25 | 20 min | Retrieval & Grounding |
| 1:45 | 15 min | Wrap-Up & Demo |

**For shorter sessions:** Start from `checkpoints/lesson-04` (backend ready).

---

## Live Demo Script

### Opening Demo (15 minutes)

Start with the **finished app** to show people what they're building.

1. **Dashboard** (1 min)
   - "This is AfyaPack — an AI health assistant for frontline health workers."
   - Point out: AI status, protocol count, stock alerts

2. **Chat Demo** (4 min)
   - Type: "A 2-year-old child has fever and diarrhea, unable to drink"
   - Show: AI response with citations, safety note
   - Type the same in Swahili: "Mtoto wa miaka 2 ana homa na kuhara"
   - Show: Language detection, bilingual response
   
3. **Encounter Flow** (3 min)
   - Walk through the 4-step triage form
   - Show live red flag detection as you enter high temperature
   - Generate guidance and show citations

4. **Architecture Explanation** (4 min)
   - "All of this runs locally. No internet needed."
   - "The AI model is running on this machine via Foundry Local."
   - "Every response cites specific clinical protocols."
   - "Critical danger signs trigger rule-based alerts — not AI predictions."

5. **Set the Hook** (3 min)
   - "By the end of this session, you will have built this yourself."
   - "We'll use GitHub Copilot as our AI pair programmer."
   - "You'll learn to prompt effectively — a skill you'll use forever."

---

## Teaching Checkpoints

After each major section, pause to verify everyone succeeded.

### Checkpoint 1: After Setup (Lesson 02)

**Verify:**
```powershell
node verify-setup.js
```

**Expected:**
```
✓ Foundry Local is working!
✓ Response: Setup complete.
```

**Action if failing:** Provide pre-loaded checkpoint USB.

### Checkpoint 2: After Backend API (Lesson 04)

**Verify:**
```powershell
curl http://localhost:3001/api/health
```

**Expected:**
```json
{ "status": "ok", "message": "AfyaPack API is running" }
```

**Action if failing:** Copy from `checkpoints/lesson-04`.

### Checkpoint 3: After Foundry Integration (Lesson 05)

**Verify:**
- Open the chat, send "Hello"
- Should get an AI response

**Action if failing:** Check `.env` file, restart server.

### Checkpoint 4: After Chat UI (Lesson 06)

**Verify:**
- Web UI loads at localhost:3000
- Chat interface is visible
- Sending a message shows AI response

**Action if failing:** Copy from `checkpoints/lesson-06`.

### Checkpoint 5: After Retrieval (Lesson 07)

**Verify:**
- Send "child with fever and diarrhea"
- Response should include **Sources Used** section

**Action if failing:** Ensure database is seeded with protocols.

---

## Common Issues & Solutions

### "Foundry Local not running"

```powershell
# Quick fix
foundry local start

# Nuclear option
foundry local stop
foundry local start
```

### "Model not found"

```powershell
foundry model list

# If empty:
foundry model pull qwen2.5-0.5b-instruct
```

### "Copilot not suggesting code"

1. Check GitHub sign-in (bottom left corner)
2. Check subscription status at github.com/settings/copilot
3. Restart VS Code
4. As last resort: use the prompt library manually

### "npm install fails"

```powershell
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### "CORS errors in browser"

- Ensure API is running on port 3001
- Check WEB_URL in `.env` matches frontend URL
- Restart API server

### "AI responses are slow"

- First request is slow (model loading). Subsequent requests faster.
- If consistently slow: reduce `max_tokens` in prompts
- CPU-only is slower than GPU — set expectations

---

## Catching Up Slow Learners

### During the Session

1. **Pair slow learners** with someone further ahead
2. **Teaching assistants** should actively circulate
3. **Checkpoint folders** let anyone jump ahead:
   ```powershell
   # Copy checkpoint to working directory
   cp -r checkpoints/lesson-06/* ./
   npm run install:all
   npm run dev
   ```

### Between Sections

During breaks:
1. Announce: "If you're stuck, raise your hand or come to the front"
2. Have TAs help copy checkpoint code
3. Run quick verification commands together

### As Last Resort

Provide USB drive with:
- Complete `final/` folder ready to run
- Pre-installed `node_modules/`
- Pre-seeded database

Even if someone falls behind completely, they can run the final app and understand it.

---

## Key Talking Points

### On Foundry Local

> "Foundry Local is Microsoft's local AI inference runtime. It lets you run AI models directly on your machine — no cloud API, no internet required. For something like patient health data, this matters enormously."

### On Prompt Engineering

> "The prompt you write is the most important line of code in an AI application. A good prompt makes the AI reliable. A bad prompt makes it hallucinate. We're going to learn to write good prompts."

### On Grounding

> "The AI doesn't know anything about clinical protocols. We give it knowledge by retrieving relevant chunks from our protocol database and putting them directly in the prompt. The AI becomes a reliable summarizer of verified information."

### On Safety

> "For danger signs — high fever, convulsions, shock — we do NOT rely on AI. We use rule-based code. `if (temperature > 40) alert('URGENT')`. Critical safety logic must be deterministic, not probabilistic."

### On GitHub Copilot

> "Copilot isn't magic. It's a tool that amplifies your skills. If you prompt vaguely, you get vague code. If you prompt precisely — with context, constraints, and examples — you get production-quality code."

---

## Post-Lab Resources

Share these with attendees after the session:

### Links
- **GitHub Repository:** [Link to repo]
- **Foundry Local Documentation:** [Link]
- **GitHub Copilot Resources:** [Link]
- **Prompt Engineering Guide:** [Link]

### Certificates
Consider providing completion certificates that mention:
- "Built an offline-first AI health assistant"
- "Used Foundry Local for local AI inference"
- "Applied prompt engineering for grounded AI responses"

### Social
- Encourage attendees to share on LinkedIn/Twitter
- Hashtag: #AfyaPack #FoundryLocal #GitHubCopilot
- Photo op with the app running

---

## Contingency Plans

### No Internet (Copilot doesn't work)

1. Use the `prompts/` directory — attendees copy-paste prompts manually
2. Instructor types live, attendees follow along
3. Focus on concepts, not speed

### No Foundry Local (model unavailable)

1. Switch to Ollama fallback (if installed)
2. Use mock mode (AfyaPack has built-in mock responses)
3. Demo from instructor's machine only

### Major Technical Failure

1. Switch to "watch me build" mode
2. Walk through architecture and code conceptually
3. Everyone runs the final app for the demo portion

---

## Feedback Collection

At session end, collect:

1. **Quick poll** (show of hands):
   - "How many of you got the app running?"
   - "How many learned something new about prompt engineering?"
   - "How many are excited to use Foundry Local in your own projects?"

2. **Written feedback** (if time allows):
   - What worked well?
   - What was confusing?
   - What would you add or remove?

3. **Contact info** for follow-up questions

---

**You've got this. Go teach them to build something amazing. 🚀**
