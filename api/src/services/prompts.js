/**
 * Prompt builder for AfyaPack grounded guidance.
 * Safety-first, citation-grounded, non-diagnostic.
 */

const SYSTEM_PROMPT = `You are AfyaPack, a protocol-based clinical decision support tool for frontline health workers.

CRITICAL RULES:
1. You are NOT a diagnostic tool. Never state a diagnosis.
2. Base your guidance ONLY on the protocol excerpts provided. Do not use outside knowledge.
3. Always include a clear safety note that this is decision support only.
4. Always state when referral or escalation is needed.
5. Cite which protocol source(s) your guidance is based on.
6. Use plain, clear language appropriate for frontline workers.
7. Structure your response with clear sections.
8. If the retrieved protocols do not cover the presentation, explicitly say so.

RESPONSE FORMAT:
Respond in this exact structure:

**Assessment Context**
[Brief 1-2 sentence summary of the key clinical picture]

**Protocol-Based Guidance**
[Numbered list of recommended actions based ONLY on retrieved protocols]

**When to Refer/Escalate**
[Clear conditions that require referral, based on protocols]

**Sources Used**
[List the protocol titles cited, numbered]

**Safety Note**
⚠️ This is protocol-based decision support only. It does not replace clinical assessment. Escalate when uncertain.`;

/**
 * Build a grounded prompt from patient data and retrieved chunks.
 */
function buildGuidancePrompt(encounter, retrievedChunks) {
  const chunkText = retrievedChunks
    .map((c, i) => `[${i + 1}] From "${c.doc_title}" — ${c.section ? `(${c.section}) ` : ''}:\n${c.content}`)
    .join('\n\n');

  const symptomList = Array.isArray(encounter.symptoms)
    ? encounter.symptoms.join(', ')
    : encounter.symptoms || 'not specified';

  const dangerList = Array.isArray(encounter.danger_signs) && encounter.danger_signs.length > 0
    ? encounter.danger_signs.join(', ')
    : 'none reported';

  const userPrompt = `PATIENT PRESENTATION:
- Age: ${encounter.age || 'unknown'} years
- Sex: ${encounter.sex || 'unknown'}
- Pregnant: ${encounter.pregnant ? 'Yes' : 'No'}
- Symptoms: ${symptomList}
- Duration: ${encounter.duration || 'not specified'}
- Temperature: ${encounter.temperature ? `${encounter.temperature}°C` : 'not recorded'}
- Pulse: ${encounter.pulse ? `${encounter.pulse} bpm` : 'not recorded'}
- Danger signs present: ${dangerList}
- Notes: ${encounter.notes || 'none'}

RETRIEVED PROTOCOL EXCERPTS:
${chunkText || '[No matching protocol sections found for this presentation]'}

Based ONLY on the protocol excerpts above, provide structured clinical decision support.`;

  return { systemPrompt: SYSTEM_PROMPT, userPrompt };
}

/**
 * Build a referral summary prompt.
 */
function buildReferralPrompt(encounter, guidanceText) {
  const symptomList = Array.isArray(encounter.symptoms)
    ? encounter.symptoms.join(', ')
    : encounter.symptoms || 'not specified';

  const userPrompt = `Generate a concise clinical referral handoff note for the following patient.
Keep it under 200 words. Use clear, structured format.

PATIENT:
- Age: ${encounter.age || '?'} | Sex: ${encounter.sex || '?'} | Pregnant: ${encounter.pregnant ? 'Yes' : 'No'}
- Presenting complaints: ${symptomList}
- Duration: ${encounter.duration || 'not specified'}
- Vitals: Temp ${encounter.temperature || '?'}°C, Pulse ${encounter.pulse || '?'} bpm
- Danger signs: ${Array.isArray(encounter.danger_signs) ? encounter.danger_signs.join(', ') || 'none' : 'none'}

CLINICAL GUIDANCE SUMMARY:
${guidanceText ? guidanceText.slice(0, 400) + '...' : 'See attached encounter record'}

Write a REFERRAL NOTE in this format:
**Patient:** [age/sex/pregnancy status]
**Referred on:** [Today's date]
**Presenting complaint:** [brief summary]
**Vitals at referral:** [key vitals]
**Clinical concern:** [reason for referral - do NOT state diagnosis]
**Actions taken:** [any interventions]
**Urgency:** [URGENT / Routine]
**Referring facility/worker:** AfyaPack Field Record`;

  return {
    systemPrompt: 'You write concise, professional clinical referral handoff notes for frontline health workers. Never state a diagnosis. Use structured format.',
    userPrompt,
  };
}

module.exports = { buildGuidancePrompt, buildReferralPrompt, SYSTEM_PROMPT };
