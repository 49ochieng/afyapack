# Lesson 13: Testing & Demo

> Validate the complete system and deliver a compelling demo.

---

## Lesson Overview

| | |
|---|---|
| **Duration** | 30 minutes |
| **Objective** | Test all features and prepare for demonstration |
| **Output** | A polished, working demo ready for presentation |
| **Prerequisites** | All previous lessons complete |
| **Files/Folders** | All project files |

---

## Demo Flow Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      AFYAPACK DEMO FLOW                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. CHAT BASICS                  2. PATIENT TRIAGE             │
│  ┌─────────────────┐            ┌─────────────────┐           │
│  │ "What is malaria?"│  ───►    │ Encounter Form   │           │
│  │ AI Response      │           │ 2yr, fever, rash │           │
│  │ + Citations      │           │ → RED FLAGS! 🚨   │           │
│  └─────────────────┘            └─────────────────┘           │
│          │                              │                      │
│          ▼                              ▼                      │
│  3. GROUNDED GUIDANCE            4. STOCK CHECK                │
│  ┌─────────────────┐            ┌─────────────────┐           │
│  │ "Child has diarr│            │ Low: Paracetamol │           │
│  │  -hea 3 days"   │            │ OK: ORS sachets  │           │
│  │ → ORS + Zinc    │            │ Out: Amoxicillin │           │
│  │ → Protocol ref  │            └─────────────────┘           │
│  └─────────────────┘                    │                      │
│          │                              │                      │
│          ▼                              ▼                      │
│  5. MULTILINGUAL SWITCH          FINALE                        │
│  ┌─────────────────┐            ┌─────────────────┐           │
│  │ EN → SW         │    ───►    │ "All features    │           │
│  │ "Habari" chat   │            │  work offline!" │           │
│  └─────────────────┘            └─────────────────┘           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Pre-Demo Checklist

### System Verification

Run through this checklist before any demo:

```bash
# 1. Check Foundry Local is running
curl http://127.0.0.1:54346/v1/models
# Should return model list

# 2. Check API is healthy  
curl http://localhost:3001/health
# Should return { ok: true, ai: "foundry" }

# 3. Check database has protocols
curl http://localhost:3001/protocols
# Should return protocol list

# 4. Check web app is running
# Visit http://localhost:3000
# Should see home page
```

### Quick Test Script

Create `scripts/pre-demo-check.js`:

```javascript
const checks = [
  {
    name: 'Foundry Local',
    url: 'http://127.0.0.1:54346/v1/models',
    validate: (data) => data.data?.length > 0
  },
  {
    name: 'API Health',
    url: 'http://localhost:3001/health', 
    validate: (data) => data.ok === true
  },
  {
    name: 'Protocols Loaded',
    url: 'http://localhost:3001/protocols',
    validate: (data) => data.protocols?.length > 0
  },
  {
    name: 'Chat Endpoint',
    url: 'http://localhost:3001/chat/test',
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] })
    },
    validate: (data) => data.response?.length > 0
  }
];

async function runChecks() {
  console.log('🏥 AfyaPack Pre-Demo Check\n');
  console.log('='.repeat(40));
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const res = await fetch(check.url, check.options || {});
      const data = await res.json();
      
      if (check.validate(data)) {
        console.log(`✅ ${check.name}`);
      } else {
        console.log(`❌ ${check.name} - Validation failed`);
        allPassed = false;
      }
    } catch (err) {
      console.log(`❌ ${check.name} - ${err.message}`);
      allPassed = false;
    }
  }
  
  console.log('='.repeat(40));
  
  if (allPassed) {
    console.log('\n🎉 All checks passed! Ready for demo.');
  } else {
    console.log('\n⚠️ Some checks failed. Review before demo.');
  }
}

runChecks();
```

Run with:
```bash
node scripts/pre-demo-check.js
```

---

## Demo Script (5 Minutes)

### Scene 1: The Problem (30 seconds)

**Talking points:**
- "Community health workers in rural Tanzania serve 500+ families"
- "No reliable internet - cellular coverage is spotty"
- "They need clinical decision support NOW, not when they have signal"
- "AfyaPack runs AI completely locally on their device"

### Scene 2: Local AI Power (60 seconds)

**Action:** Open chat, ask a medical question.

```
Demo: "What are the signs of severe malaria in a child?"
```

**Talking points:**
- "This query is being processed right here on this laptop"
- "No cloud, no internet, no data leaving the device"
- "Foundry Local runs a 500M parameter model on CPU"
- "Response time is fast enough for clinical use"

### Scene 3: Patient Encounter (90 seconds)

**Action:** Fill out encounter form with red flag case.

```
Demo inputs:
- Age: 2 years
- Symptoms: fever, rash, not eating
- Duration: 3 days
- Temperature: 39.5°C
```

**Talking points:**
- Point out the red flag banner appears INSTANTLY
- "This isn't AI - it's deterministic rules we KNOW are correct"
- "The AI guidance below is grounded in WHO protocols"
- "Notice the citation - we can trace every recommendation"

### Scene 4: Protocol Grounding (60 seconds)

**Action:** Show the retrieval working.

```
Demo: "How do I treat a child with diarrhea?"
```

**Talking points:**
- "The AI searched our WHO protocol database"
- "It found relevant paragraphs using TF-IDF search"
- "The response is grounded in these specific protocols"
- "Click the citation to see the source"

### Scene 5: Practical Features (60 seconds)

**Action:** Show stock tracking.

- Add an item with low quantity
- Show the low stock alert
- Demonstrate search/filter

**Action:** Switch language to Swahili.

- Toggle to "Kiswahili"
- Show the UI updates
- Chat in Swahili: "Mtoto ana homa"

### Scene 6: The Vision (30 seconds)

**Close with:**
- "Everything you just saw runs without internet"
- "Built with Foundry Local, grounded in real protocols"
- "This is responsible AI - transparent, safe, and accessible"

---

## Common Demo Issues & Fixes

### Issue: AI responses are slow

```bash
# Check CPU usage
# If high, close other apps

# Reduce max_tokens in foundry.js
const response = await client.chat.completions.create({
  // ...
  max_tokens: 256  // Reduce from 512
});
```

### Issue: Red flags not showing

```javascript
// Check the redflags.js thresholds
// Temperature threshold might be too high
FEVER: {
  infant: 38,    // Was it 38.5?
  child: 38.5,
  adult: 38.5
}
```

### Issue: Protocols not found

```bash
# Reseed the database
cd api
rm data/afyapack.db  
npm run seed
```

### Issue: Chat gives generic responses

Check that retrieval is working:
```bash
curl "http://localhost:3001/protocols/search?q=malaria"
# Should return relevant chunks
```

If empty, protocols weren't seeded properly.

---

## Feature Testing Matrix

| Feature | Test Input | Expected Result |
|---------|------------|-----------------|
| Chat - Basic | "What is ORS?" | Explains oral rehydration salts |
| Chat - Swahili | "Nini dalili za malaria?" | Responds in Swahili |
| Encounter - Normal | 5yr, mild cough | Green guidance, no flags |
| Encounter - Red Flag | 1yr, 40°C fever | Red banner, urgent referral |
| Stock - Add | Paracetamol, 100 | Shows in inventory |
| Stock - Low Alert | Any item < 10 | Yellow warning badge |
| Language Switch | EN → SW | Full UI translation |
| Offline | Disconnect WiFi | Everything still works |

---

## Offline Demo (The "Airplane Mode" Test)

The ultimate demo is showing it works offline:

1. **Show network connected** - Demonstrate chat works
2. **Enable airplane mode** on the laptop
3. **Show network is disconnected** - Browser shows offline icon
4. **Continue using the app** - Chat, encounter, stock all work
5. **Emphasize:** "This is the real value for remote health workers"

---

## Presentation Tips

### Do:
- Start with the WHY (rural health workers)
- Show real patient scenarios
- Emphasize "no internet required"
- Point to the citations (trustworthy AI)
- Switch to Swahili (localization matters)

### Don't:
- Spend too long on technical setup
- Use medical terms without explaining
- Rush through red flag demonstration
- Skip the offline demonstration

---

## Post-Demo Discussion Points

Questions you might get:

**"How accurate is the AI?"**
> "The AI is grounded in WHO-approved protocols. Every recommendation has a citation. Critical safety rules are deterministic, not AI-generated."

**"What model is running?"**
> "Qwen 2.5 0.5B Instruct - a 500 million parameter model optimized for CPU. It runs locally through Foundry Local."

**"Could this run on a phone?"**
> "The web app works on any device. The model requires a computer, but we could use a shared local server or investigate smaller on-device models."

**"How do you update protocols?"**
> "Protocols are JSON files that can be updated. The system re-indexes them automatically."

---

## Validation Checklist

Final QA before any demo:

- [ ] Foundry Local is running and responsive
- [ ] API returns healthy status
- [ ] Protocols are seeded (5+ protocols)
- [ ] Chat responds within 5 seconds
- [ ] Red flags trigger correctly
- [ ] Stock items can be added/subtracted
- [ ] Language switching works
- [ ] Citations link to sources
- [ ] Mobile view is responsive
- [ ] App works in airplane mode

---

## What You Built

Over 13 lessons, you created:

```
┌─────────────────────────────────────────────────────────────┐
│                        AFYAPACK                             │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)           Backend (Express)             │
│  ├─ Chat Interface            ├─ REST API                   │
│  ├─ Encounter Form            ├─ SQLite Database            │
│  ├─ Stock Management          ├─ TF-IDF Retrieval           │
│  ├─ Red Flag Display          ├─ Foundry Integration        │
│  ├─ Multilingual UI           └─ Protocol Grounding         │
│  └─ Responsive Design                                       │
│                                                             │
│  AI Layer (Foundry Local)     Safety Layer                  │
│  ├─ Qwen 2.5 0.5B Model       ├─ Deterministic Rules        │
│  ├─ OpenAI-Compatible API     ├─ Age-Specific Thresholds    │
│  ├─ Local-Only Processing     ├─ Symptom Pattern Matching   │
│  └─ Fallback Chain            └─ Red Flag Escalation        │
└─────────────────────────────────────────────────────────────┘
```

### Skills Acquired

1. **Foundry Local** - Running AI models locally
2. **RAG Pattern** - Retrieval-Augmented Generation
3. **TF-IDF Search** - Text similarity without vectors
4. **Prompt Engineering** - Effective system prompts
5. **React Context** - Global state management
6. **Express APIs** - RESTful backend design
7. **SQLite** - Embedded database operations
8. **Responsible AI** - Safety-first design patterns
9. **i18n** - Internationalization patterns
10. **Framer Motion** - UI animations
11. **GitHub Copilot** - AI-assisted development

---

## Congratulations! 🎉

You've completed the AfyaPack Hands-On Lab.

You built a complete, production-quality AI application that:
- Runs completely offline
- Uses local AI responsibly
- Serves a real humanitarian need
- Demonstrates professional engineering

**Take this knowledge and build something that matters.**

---

*The end of the lab is the beginning of your journey. →*
