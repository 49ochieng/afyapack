# Prompt: Red Flag Safety Rules

## Description
Create a deterministic safety screening system that identifies medical red flags without relying on AI inference.

---

## The Prompt

```
Create a JavaScript module for medical red flag detection that:
1. Uses deterministic rule-based logic (NOT AI)
2. Has age-specific thresholds (infant, child, adult)
3. Checks vital signs against danger thresholds
4. Pattern matches symptoms against known danger patterns
5. Returns structured results with severity levels
6. Is designed for community health workers, not doctors
7. Errs on the side of caution (false positives OK, false negatives not)

Include rules for:
- Fever by age
- Respiratory rate by age  
- Dehydration signs
- Danger symptom patterns
- Duration thresholds

Export a checkRedFlags function that takes patient data and returns findings.
```

---

## Expected Output

```javascript
// Red flag thresholds by age group
const THRESHOLDS = {
  fever: {
    infant: 38.0,    // Under 3 months
    child: 39.0,     // 3 months to 5 years
    adult: 39.5      // Over 5 years
  },
  respRate: {
    infant: { min: 30, max: 60 },
    child: { min: 20, max: 40 },
    adult: { min: 12, max: 20 }
  },
  heartRate: {
    infant: { min: 100, max: 160 },
    child: { min: 70, max: 120 },
    adult: { min: 60, max: 100 }
  }
};

// Danger patterns - if ANY match, flag immediately
const DANGER_PATTERNS = [
  { pattern: /convulsion|seizure|fitting/i, severity: 'critical', message: 'Possible seizure - URGENT' },
  { pattern: /unconscious|unresponsive|not waking/i, severity: 'critical', message: 'Altered consciousness - EMERGENCY' },
  { pattern: /difficulty breathing|can't breathe|gasping/i, severity: 'critical', message: 'Respiratory distress - URGENT' },
  { pattern: /blood in stool|bloody diarrhea/i, severity: 'high', message: 'GI bleeding - refer today' },
  { pattern: /severe dehydration|sunken eyes|not urinating/i, severity: 'high', message: 'Dehydration risk - assess fluids' },
  { pattern: /neck stiffness|stiff neck/i, severity: 'critical', message: 'Possible meningitis - EMERGENCY' },
  { pattern: /chest pain|heart pain/i, severity: 'high', message: 'Cardiac symptoms - refer today' },
  { pattern: /pregnant.*bleeding|vaginal bleeding.*pregnant/i, severity: 'critical', message: 'Pregnancy emergency' }
];

// Duration that escalates concern
const DURATION_THRESHOLDS = {
  fever: 3,           // Days
  diarrhea: 3,        // Days  
  vomiting: 2,        // Days
  cough: 14,          // Days
  notEating: 2        // Days
};

function getAgeGroup(ageValue, ageUnit) {
  const ageInMonths = ageUnit === 'years' ? ageValue * 12 : ageValue;
  if (ageInMonths < 3) return 'infant';
  if (ageInMonths < 60) return 'child';
  return 'adult';
}

function parseTemperature(temp) {
  if (typeof temp === 'number') return temp;
  if (typeof temp === 'string') {
    const num = parseFloat(temp.replace(/[^\d.]/g, ''));
    return isNaN(num) ? null : num;
  }
  return null;
}

function parseDuration(duration) {
  if (typeof duration === 'number') return duration;
  if (typeof duration === 'string') {
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }
  return null;
}

/**
 * Check patient data for red flags
 * @param {Object} patient - Patient data
 * @returns {Object} - { hasFlags: boolean, flags: Array, severity: string }
 */
export function checkRedFlags(patient) {
  const flags = [];
  const ageGroup = getAgeGroup(patient.age, patient.ageUnit || 'years');
  
  // 1. Temperature check
  const temp = parseTemperature(patient.temperature);
  if (temp !== null) {
    const threshold = THRESHOLDS.fever[ageGroup];
    if (temp >= threshold) {
      const severity = temp >= threshold + 1 ? 'critical' : 'high';
      flags.push({
        type: 'vital',
        severity,
        field: 'temperature',
        message: `High fever: ${temp}°C (threshold: ${threshold}°C for ${ageGroup})`,
        action: severity === 'critical' ? 'Seek immediate care' : 'Monitor closely, refer if persists'
      });
    }
  }
  
  // 2. Symptom pattern matching
  const symptomsText = Array.isArray(patient.symptoms) 
    ? patient.symptoms.join(' ') 
    : String(patient.symptoms || '');
  
  for (const danger of DANGER_PATTERNS) {
    if (danger.pattern.test(symptomsText)) {
      flags.push({
        type: 'symptom',
        severity: danger.severity,
        pattern: danger.pattern.source,
        message: danger.message,
        action: danger.severity === 'critical' ? 'IMMEDIATE REFERRAL' : 'Refer today'
      });
    }
  }
  
  // 3. Duration check
  const duration = parseDuration(patient.duration);
  if (duration !== null) {
    for (const [condition, threshold] of Object.entries(DURATION_THRESHOLDS)) {
      if (symptomsText.toLowerCase().includes(condition) && duration >= threshold) {
        flags.push({
          type: 'duration',
          severity: 'medium',
          condition,
          message: `${condition} for ${duration} days (threshold: ${threshold} days)`,
          action: 'Consider referral if not improving'
        });
      }
    }
  }
  
  // 4. Age-specific risks
  if (ageGroup === 'infant') {
    // Infants get automatic escalation
    flags.forEach(f => {
      if (f.severity === 'medium') f.severity = 'high';
    });
    
    // Additional infant-specific checks
    if (symptomsText.match(/not feeding|refusing breast|refusing bottle/i)) {
      flags.push({
        type: 'feeding',
        severity: 'high',
        message: 'Infant not feeding - risk of dehydration',
        action: 'Assess hydration, consider referral'
      });
    }
  }
  
  // Calculate overall severity
  let overallSeverity = 'none';
  if (flags.some(f => f.severity === 'critical')) overallSeverity = 'critical';
  else if (flags.some(f => f.severity === 'high')) overallSeverity = 'high';
  else if (flags.some(f => f.severity === 'medium')) overallSeverity = 'medium';
  else if (flags.length > 0) overallSeverity = 'low';
  
  return {
    hasFlags: flags.length > 0,
    flags,
    severity: overallSeverity,
    ageGroup,
    requiresReferral: overallSeverity === 'critical' || overallSeverity === 'high'
  };
}
```

---

## Usage Example

```javascript
const result = checkRedFlags({
  age: 2,
  ageUnit: 'years',
  symptoms: ['fever', 'not eating', 'rash'],
  temperature: 39.5,
  duration: '3 days'
});

console.log(result);
// {
//   hasFlags: true,
//   severity: 'high',
//   flags: [
//     { type: 'vital', severity: 'high', message: 'High fever: 39.5°C...' },
//     { type: 'duration', severity: 'medium', message: 'fever for 3 days...' }
//   ],
//   requiresReferral: true
// }
```

---

## Key Design Principles

### 1. Deterministic Over Probabilistic
AI can hallucinate. Safety rules must NOT. Every red flag rule should be:
- Explicitly defined
- Testable
- Predictable

### 2. Conservative Thresholds
```
Preference: False positive > False negative
```
Better to flag something that isn't dangerous than miss something that is.

### 3. Age-Stratified Logic
What's normal for an adult may be critical for an infant:
- Infant fever threshold: 38.0°C (100.4°F)
- Adult fever threshold: 39.5°C (103.1°F)

### 4. Transparent Rules
Users should be able to see WHY a flag was raised:
```javascript
{
  message: 'High fever: 39.5°C (threshold: 39.0°C for child)',
  action: 'Monitor closely, refer if persists'
}
```

---

## Anti-Patterns

❌ **Relying on AI for Safety**
```javascript
// BAD: Don't let AI decide what's dangerous
const isEmergency = await ai.classify(symptoms);
```

❌ **Hard-Coded Magic Numbers**
```javascript
// BAD: Unexplained thresholds
if (temp > 38.5) flag();
```

✅ **Correct: Named, Documented Thresholds**
```javascript
const THRESHOLDS = {
  fever: { infant: 38.0 }  // WHO guidelines
};
```

---

## Testing Red Flags

```javascript
// Test suite examples
describe('Red Flag Detection', () => {
  it('flags high infant fever', () => {
    const result = checkRedFlags({ age: 2, ageUnit: 'months', temperature: 38.5 });
    expect(result.hasFlags).toBe(true);
    expect(result.severity).toBe('critical');
  });
  
  it('does not flag normal adult temp', () => {
    const result = checkRedFlags({ age: 30, ageUnit: 'years', temperature: 37.5 });
    expect(result.hasFlags).toBe(false);
  });
  
  it('catches seizure keywords', () => {
    const result = checkRedFlags({ symptoms: 'child is fitting and shaking' });
    expect(result.flags.some(f => f.message.includes('seizure'))).toBe(true);
  });
});
```
