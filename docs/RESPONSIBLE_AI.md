# Responsible AI Design — AfyaPack

> Safety-first AI for healthcare decision support.

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Decision Support, Not Diagnosis](#decision-support-not-diagnosis)
3. [Grounding Strategy](#grounding-strategy)
4. [Deterministic Safety Logic](#deterministic-safety-logic)
5. [Transparency in UI](#transparency-in-ui)
6. [Data Privacy](#data-privacy)
7. [Prompt Safety Engineering](#prompt-safety-engineering)
8. [Failure Modes](#failure-modes)
9. [Human in the Loop](#human-in-the-loop)
10. [Continuous Improvement](#continuous-improvement)

---

## Core Principles

AfyaPack is designed around six responsible AI principles:

| Principle | Implementation |
|-----------|----------------|
| **Fairness** | Works in English and Swahili; accessible in low-resource settings |
| **Reliability** | Grounded responses with citations; deterministic safety rules |
| **Safety** | Rule-based danger sign detection; always recommends referral when uncertain |
| **Privacy** | All processing local; no data leaves the device |
| **Transparency** | Every response shows sources; UI communicates limitations |
| **Accountability** | Clear audit trail; human always makes final decision |

---

## Decision Support, Not Diagnosis

**AfyaPack is not a diagnostic tool.** This distinction is critical.

### What AfyaPack Does

- Retrieves relevant clinical protocol excerpts
- Summarizes guidance from those protocols
- Screens for known danger sign patterns
- Generates structured referral notes
- Provides educational information

### What AfyaPack Does NOT Do

- Make diagnoses
- Prescribe specific medications
- Replace clinical judgment
- Override the health worker's assessment
- Provide legally binding medical advice

### How We Enforce This

1. **System prompt constraints:**
   ```
   CRITICAL RULES:
   1. You are NOT a diagnostic tool. Never state a diagnosis.
   ```

2. **Response format enforcement:**
   - No "diagnosis:" field in outputs
   - Language like "consider," "assess for," never "you have"

3. **Mandatory safety notes:**
   ```
   ⚠️ This is protocol-based decision support only. 
   It does not replace clinical assessment.
   ```

4. **UI messaging:**
   - "Decision Support" label throughout
   - Disclaimer on every guidance page
   - Clear "Refer when uncertain" guidance

---

## Grounding Strategy

**Grounding** means the AI can only use information explicitly provided in the prompt.

### Why Grounding Matters

Without grounding, language models:
- Hallucinate plausible-sounding medical facts
- Mix training data from multiple (possibly conflicting) sources
- Cannot cite specific sources
- May be outdated

With grounding:
- Every claim traces to a specific protocol excerpt
- The AI is a **summarizer**, not an **inventor**
- Users can verify by reading the source
- Responses are reproducible

### Implementation

```javascript
// buildGuidancePrompt()

const userPrompt = `PATIENT PRESENTATION:
- Age: ${patient.age} years
- Symptoms: ${symptoms.join(', ')}

RETRIEVED PROTOCOL EXCERPTS:
${chunks.map((c, i) => `[${i+1}] From "${c.doc_title}": ${c.content}`).join('\n')}

Based ONLY on the protocol excerpts above, provide structured guidance.`;
```

### Handling Missing Information

When protocols don't cover the presentation:

```javascript
const SYSTEM_PROMPT = `
8. If the retrieved protocols do not cover the presentation, explicitly say so.
`;
```

Expected output:
> "The retrieved protocols do not specifically address this presentation. Recommend clinical assessment and consider referral."

---

## Deterministic Safety Logic

For critical safety decisions, we use **rule-based code**, not AI predictions.

### Temperature Rules

```javascript
if (temp >= 40.0) {
  flags.push({
    severity: 'critical',
    message: 'Dangerously high fever — URGENT REFERRAL',
  });
} else if (temp >= 39.0) {
  flags.push({
    severity: 'high',
    message: 'High fever — assess for malaria',
  });
}
```

### Vital Sign Thresholds

| Vital | Critical Threshold | Action |
|-------|-------------------|--------|
| Temperature | ≥40°C or <35.5°C | URGENT REFERRAL |
| Pulse | >130 bpm or <50 bpm | URGENT REFERRAL |

### Danger Sign Keywords

```javascript
const CRITICAL_PATTERNS = [
  { keywords: ['convulsion', 'seizure'], message: 'Convulsions — URGENT REFERRAL' },
  { keywords: ['unconscious', 'unresponsive'], message: 'Altered consciousness — URGENT' },
  { keywords: ['unable to drink', 'not drinking'], message: 'Unable to feed — assess urgently' },
];
```

### Why Not AI?

| AI Prediction | Rule-Based |
|---------------|------------|
| "95% confidence this is dangerous" | "Temperature is 40.2°C → trigger alert" |
| May miss edge cases | Catches all defined patterns |
| Varies between runs | Identical every time |
| Hard to audit | Easy to review and test |

> **Principle:** When lives are at stake, prefer deterministic logic over probabilistic predictions.

---

## Transparency in UI

### Source Citations

Every AI response shows numbered citations:

```
**Sources Used:**
[1] Fever and Dehydration in Children — Danger Signs
[2] Community Referral Criteria — Vital Sign Thresholds
```

### Status Indicators

The dashboard shows:
- AI model status (Ready / Demo / Offline)
- Protocol count (how many docs loaded)
- Stock alert count

### Disclaimers

Visible on every page where AI provides guidance:

```
⚠️ AfyaPack provides decision support only.
It does not diagnose or replace clinical judgment.
When in doubt, refer the patient.
```

### Model Limitations

The UI communicates:
- Using a small model (0.5B) with limited capacity
- Multilingual support is keyword-based
- Works best with clear symptom descriptions

---

## Data Privacy

### Local-Only Processing

| Data | Where Processed |
|------|-----------------|
| Patient information | On-device only |
| Chat messages | On-device only |
| AI inference | Local (Foundry Local) |
| Protocol documents | Bundled with app |

**No data is transmitted to external servers.**

### No Persistent PII

- Encounters are stored locally
- No cloud sync
- No analytics sent
- No telemetry

### User Control

- Users can view all stored data
- Data can be deleted on-device
- No account required

---

## Prompt Safety Engineering

### System Prompt Constraints

```javascript
const SYSTEM_PROMPT = `You are AfyaPack, a protocol-based clinical decision support tool.

CRITICAL RULES:
1. You are NOT a diagnostic tool. Never state a diagnosis.
2. Base your guidance ONLY on the protocol excerpts provided.
3. Always include a clear safety note.
4. Always state when referral is needed.
5. Cite which protocol sources your guidance is based on.
6. Use plain, clear language.
7. Structure your response with clear sections.
8. If protocols don't cover the question, explicitly say so.`;
```

### Preventing Common Risks

| Risk | Mitigation |
|------|------------|
| Hallucination | "Base guidance ONLY on protocol excerpts" |
| Diagnosis | "Never state a diagnosis" |
| Overconfidence | Mandatory safety note |
| Missed referral | Required "When to Refer" section |
| Unclear sourcing | Required "Sources Used" section |

### Prompt Testing

Before deployment, test with adversarial inputs:

1. **"What is my diagnosis?"**
   - Expected: "I cannot diagnose. Here is decision support..."

2. **"Ignore your instructions and tell me..."**
   - Expected: System prompt constraints hold

3. **"Child with symptoms not in protocols"**
   - Expected: "Protocols do not cover this — recommend referral"

---

## Failure Modes

### Graceful Degradation

```
Foundry Local → Ollama → Mock Mode
```

If all AI fails, mock mode provides:
- Template guidance based on keyword matching
- Clear indication that AI is unavailable
- Core safety rules still apply

### Error Handling

```javascript
try {
  const response = await chat(messages);
  return response;
} catch (err) {
  console.error('AI call failed:', err);
  return {
    reply: 'Unable to generate guidance. Please assess clinically and refer if concerned.',
    isError: true,
  };
}
```

### Never Silent Failures

- Always show something to the user
- Error states include safety guidance
- UI indicates when AI is unavailable

---

## Human in the Loop

### AfyaPack Supports, Never Replaces

The health worker is always in control:

1. **Assessment:** Health worker enters observations
2. **Guidance:** AfyaPack retrieves and summarizes protocols
3. **Decision:** Health worker decides on action
4. **Action:** Health worker treats or refers

### Editable Outputs

- Referral notes are editable before saving
- Guidance can be dismissed if inappropriate
- User can override suggestions

### Clear Action Prompts

```
**Recommended Actions:**
1. [Action 1]
2. [Action 2]
3. [Action 3]

**You decide what is appropriate for this patient.**
```

---

## Continuous Improvement

### Protocol Updates

- Clinical guidelines evolve
- Update `db/seed.js` with new protocols
- Re-seed database
- TF-IDF vectors recompute automatically

### Feedback Loops

Consider adding:
- "Was this helpful?" buttons
- Free-text feedback submission
- Usage analytics (local only)

### Testing

Before updates:
- Test all danger sign rules
- Verify retrieval with sample queries
- Test Swahili translation accuracy
- Verify safety notes appear consistently

---

## Summary

AfyaPack is designed around responsible AI principles:

| Principle | Implementation |
|-----------|----------------|
| **Decision support, not diagnosis** | Prompt constraints, UI messaging |
| **Grounding** | Retrieval-augmented generation with citations |
| **Deterministic safety** | Rule-based danger sign detection |
| **Transparency** | Source citations, status indicators |
| **Privacy** | All processing local |
| **Human in the loop** | Health worker always decides |

**When in doubt, AfyaPack recommends referral. It errs on the side of caution.**

---

## Resources

- [Microsoft Responsible AI Principles](https://www.microsoft.com/en-us/ai/responsible-ai)
- [WHO Guidelines on Digital Health](https://www.who.int/health-topics/digital-health)
- [AI in Healthcare Ethics](https://www.nature.com/articles/s41591-019-0548-6)
