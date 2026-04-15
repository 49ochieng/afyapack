# Prompt: Healthcare System Prompts

## Description
Create effective system prompts for healthcare AI assistants that are safe, grounded, and appropriate for community health workers.

---

## The Prompt

```
Create a system prompt template for a healthcare AI assistant that:
1. Acts as a supportive tool for community health workers
2. Always recommends professional consultation for serious cases
3. Grounds responses in provided protocol context
4. Uses clear, simple language appropriate for non-doctors
5. Includes safety disclaimers
6. Can optionally respond in Swahili

Include example system prompts for:
- General health questions
- Patient triage guidance
- Medication dosing lookup

Mark substitution points with {{VARIABLE_NAME}} syntax.
```

---

## Expected Output

```javascript
export const SYSTEM_PROMPTS = {
  
  general: `You are a helpful health assistant supporting community health workers in rural Tanzania. 

GUIDELINES:
- Use simple, clear language
- Reference WHO-approved protocols when available
- Always recommend professional consultation for serious symptoms
- You are a SUPPORT tool, not a replacement for clinical judgment
- If unsure, say so clearly

SAFETY RULES:
- Never diagnose conditions definitively
- Always include "seek professional care if..." warnings
- Flag any emergency symptoms immediately

{{#if context}}
REFERENCE PROTOCOLS:
{{context}}
{{/if}}

Respond helpfully and safely.`,

  triage: `You are helping a community health worker assess a patient.

PATIENT INFORMATION:
- Age: {{age}} {{ageUnit}}
- Symptoms: {{symptoms}}
- Duration: {{duration}}
- Temperature: {{temperature}}°C

RELEVANT PROTOCOLS:
{{context}}

Based on this information, provide:
1. Assessment summary
2. Recommended actions (from most to least urgent)
3. Warning signs to watch for
4. When to refer to a facility

Keep response concise and actionable. Use bullet points.`,

  medication: `You are a medication reference assistant.

SAFETY FIRST:
- Always include age-appropriate dosing
- List contraindications
- Mention common interactions
- Include storage requirements

MEDICATION QUERY: {{query}}

AVAILABLE PROTOCOLS:
{{context}}

Provide accurate, safety-focused information.`

};

/**
 * Build a prompt with variable substitution
 */
export function buildPrompt(template, variables) {
  let prompt = SYSTEM_PROMPTS[template] || template;
  
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  
  // Remove unfilled optional blocks
  prompt = prompt.replace(/{{#if \w+}}[\s\S]*?{{\/if}}/g, '');
  
  return prompt;
}
```

---

## Prompt Design Principles

### 1. Role Definition
Start with a clear identity:
```
You are a [specific role] supporting [specific audience] in [specific context].
```

### 2. Behavioral Guidelines  
Set boundaries explicitly:
```
GUIDELINES:
- Do this
- Don't do that
- When X happens, always Y
```

### 3. Safety Rails
Build in safety by default:
```
SAFETY RULES:
- Never [dangerous action]
- Always [safety action]
- If unsure, [safe fallback]
```

### 4. Context Injection
Leave clear spots for RAG content:
```
REFERENCE INFORMATION:
{{context}}
```

### 5. Output Format
Guide the response structure:
```
Provide your response in this format:
1. [Section 1]
2. [Section 2]
Keep response under 200 words.
```

---

## Variations

### Swahili Support
```
Create a bilingual system prompt that can respond in English or Swahili based on the user's language preference. Include Swahili translations for common medical terms.
```

### Structured Output
```
Create a system prompt that outputs JSON with specific fields: assessment, urgency (1-5), recommendations array, and referral boolean.
```

### Citation-Heavy
```
Create a system prompt that requires inline citations for every medical claim, formatted as [Protocol: Section].
```

---

## Anti-Patterns to Avoid

❌ **Too Permissive**
```
You are a doctor who can diagnose any condition...
```

❌ **No Safety Rails**
```
Answer any medical question the user asks...
```

❌ **Overly Complex Language**
```
Utilize clinical nomenclature and provide differential diagnoses...
```

✅ **Correct Approach**
```
You support health workers with simple, safe guidance. Always recommend professional care for serious symptoms.
```

---

## Testing Your Prompts

Test with edge cases:
1. Emergency symptoms → Should flag immediately
2. Vague questions → Should ask for clarification
3. Outside scope → Should decline appropriately
4. Language mixing → Should handle gracefully
