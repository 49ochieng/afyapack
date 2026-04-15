# Lesson 09: Red Flag Engine

> Build a robust rule-based safety screening system.

---

## Lesson Overview

| | |
|---|---|
| **Duration** | 30 minutes |
| **Objective** | Create comprehensive red flag detection rules |
| **Output** | Safety engine that catches critical cases |
| **Prerequisites** | Lesson 08 (Encounter triage complete) |
| **Files/Folders** | `web/src/lib/redflags.js`, `api/src/services/redflags.js` |

---

## Why Rule-Based Safety Matters

```
AI Can Hallucinate          Rules Are Deterministic
─────────────────────       ─────────────────────────
AI: "The fever of 41°C      Rule: temp >= 40 → URGENT
is moderately elevated,     ✓ Always triggers
continue monitoring..."     ✓ Never misses
❌ Dangerous advice         ✓ Explainable

            Combined Approach:
┌─────────────────────────────────────────────┐
│  RULES check vitals → Flag if critical      │
│  AI generates guidance → Helps with context │
│  Rules OVERRIDE if AI misses danger         │
└─────────────────────────────────────────────┘
```

**Key Principle:** Safety rules run BEFORE and INDEPENDENT of AI.

---

## Step 1: Expand Client-Side Red Flags

Update file `web/src/lib/redflags.js`:

### Copilot Prompt

```
@workspace Create a comprehensive red flag screening engine with:
- Temperature rules (hyper/hypothermia by age)
- Pulse rules (tachy/bradycardia by age)
- Respiratory rate rules (age-specific)
- Danger sign keyword matching
- Pregnancy-specific rules
- Age-specific thresholds (neonate, infant, child, adult)
- Severity levels: critical, high, medium
- Each flag includes: severity, message, rule id, category
```

### Expected Code

```javascript
// Age-specific vital sign thresholds
const THRESHOLDS = {
  // Temperature thresholds
  temp: {
    critical_high: 40.0,
    high: 39.0,
    elevated: 38.0,
    low: 36.0,
    critical_low: 35.0,
  },
  
  // Pulse by age group (beats per minute)
  pulse: {
    neonate: { // 0-28 days
      critical_high: 180, high: 160, low: 100, critical_low: 80
    },
    infant: { // 1-12 months
      critical_high: 170, high: 140, low: 80, critical_low: 70
    },
    child: { // 1-10 years
      critical_high: 140, high: 120, low: 70, critical_low: 60
    },
    adult: { // 10+ years
      critical_high: 130, high: 110, low: 50, critical_low: 40
    }
  },
  
  // Respiratory rate by age group
  respRate: {
    neonate: { high: 60, critical: 70 },
    infant: { high: 50, critical: 60 },
    child: { high: 40, critical: 50 },
    adult: { high: 30, critical: 40 }
  }
};

// Danger sign patterns and their meanings
const DANGER_PATTERNS = [
  {
    patterns: ['convulsion', 'seizure', 'fitting', 'jerking'],
    message: 'Convulsions/seizures reported',
    severity: 'critical',
    category: 'neurological'
  },
  {
    patterns: ['unconscious', 'unresponsive', 'not waking', 'coma'],
    message: 'Unconscious or unresponsive',
    severity: 'critical',
    category: 'neurological'
  },
  {
    patterns: ['unable to drink', 'not drinking', 'refuses fluids', 'cannot feed'],
    message: 'Unable to drink or feed',
    severity: 'critical',
    category: 'hydration'
  },
  {
    patterns: ['vomiting everything', 'persistent vomiting', 'vomits all'],
    message: 'Persistent vomiting (unable to retain fluids)',
    severity: 'critical',
    category: 'hydration'
  },
  {
    patterns: ['severe bleeding', 'hemorrhage', 'heavy bleeding', 'blood loss'],
    message: 'Severe bleeding/hemorrhage',
    severity: 'critical',
    category: 'circulation'
  },
  {
    patterns: ['stiff neck', 'neck stiffness', 'cannot bend neck'],
    message: 'Stiff neck - possible meningitis',
    severity: 'critical',
    category: 'neurological'
  },
  {
    patterns: ['bulging fontanel', 'fontanelle bulging'],
    message: 'Bulging fontanelle in infant',
    severity: 'critical',
    category: 'neurological'
  },
  {
    patterns: ['severe pallor', 'very pale', 'white palms', 'severe anemia'],
    message: 'Severe pallor - possible severe anemia',
    severity: 'critical',
    category: 'circulation'
  },
  {
    patterns: ['severe dehydration', 'skin pinch slow', 'sunken eyes'],
    message: 'Signs of severe dehydration',
    severity: 'critical',
    category: 'hydration'
  },
  {
    patterns: ['difficulty breathing', 'chest indrawing', 'nasal flaring', 'grunting'],
    message: 'Respiratory distress',
    severity: 'critical',
    category: 'respiratory'
  },
  {
    patterns: ['blue lips', 'cyanosis', 'blue fingers'],
    message: 'Cyanosis - inadequate oxygenation',
    severity: 'critical',
    category: 'respiratory'
  },
  {
    patterns: ['blood in stool', 'bloody diarrhea', 'dysentery'],
    message: 'Bloody diarrhea (dysentery)',
    severity: 'high',
    category: 'gastrointestinal'
  }
];

// Pregnancy-specific danger signs
const PREGNANCY_DANGERS = [
  {
    conditions: ['headache', 'swelling'],
    message: 'Headache with swelling - possible pre-eclampsia',
    severity: 'critical'
  },
  {
    conditions: ['bleeding'],
    message: 'Bleeding during pregnancy',
    severity: 'critical'
  },
  {
    conditions: ['convulsion'],
    message: 'Convulsions in pregnancy - possible eclampsia',
    severity: 'critical'
  },
  {
    conditions: ['fever'],
    message: 'Fever during pregnancy - requires assessment',
    severity: 'high'
  },
  {
    conditions: ['decreased movement', 'baby not moving'],
    message: 'Reduced fetal movement',
    severity: 'high'
  }
];

// Get age group for threshold lookup
function getAgeGroup(ageYears) {
  if (ageYears < 0.08) return 'neonate'; // < 1 month
  if (ageYears < 1) return 'infant';
  if (ageYears < 10) return 'child';
  return 'adult';
}

// Main screening function
export function screenRedFlags(encounter) {
  const flags = [];
  const { age, temperature, pulse, respRate, symptoms = [], danger_signs = [], pregnant, notes = '' } = encounter;
  
  const ageGroup = getAgeGroup(parseFloat(age) || 0);
  const allText = [...symptoms, ...danger_signs, notes].join(' ').toLowerCase();
  
  // Temperature checks
  const temp = parseFloat(temperature);
  if (!isNaN(temp) && temp > 0) {
    if (temp >= THRESHOLDS.temp.critical_high) {
      flags.push({
        severity: 'critical',
        message: `CRITICAL: Dangerously high fever (${temp}°C) — URGENT REFERRAL`,
        rule: 'temp_critical_high',
        category: 'vitals'
      });
    } else if (temp >= THRESHOLDS.temp.high) {
      flags.push({
        severity: 'high',
        message: `High fever (${temp}°C) — assess for severe infection`,
        rule: 'temp_high',
        category: 'vitals'
      });
    } else if (temp >= THRESHOLDS.temp.elevated) {
      flags.push({
        severity: 'medium',
        message: `Elevated temperature (${temp}°C)`,
        rule: 'temp_elevated',
        category: 'vitals'
      });
    } else if (temp <= THRESHOLDS.temp.critical_low) {
      flags.push({
        severity: 'critical',
        message: `CRITICAL: Severe hypothermia (${temp}°C) — URGENT REFERRAL`,
        rule: 'temp_critical_low',
        category: 'vitals'
      });
    } else if (temp <= THRESHOLDS.temp.low) {
      flags.push({
        severity: 'high',
        message: `Low temperature (${temp}°C) — assess for hypothermia`,
        rule: 'temp_low',
        category: 'vitals'
      });
    }
  }
  
  // Pulse checks (age-adjusted)
  const p = parseInt(pulse);
  if (!isNaN(p) && p > 0) {
    const pulseThresh = THRESHOLDS.pulse[ageGroup];
    
    if (p >= pulseThresh.critical_high) {
      flags.push({
        severity: 'critical',
        message: `CRITICAL: Severe tachycardia (${p} bpm) — URGENT REFERRAL`,
        rule: 'pulse_critical_high',
        category: 'vitals'
      });
    } else if (p >= pulseThresh.high) {
      flags.push({
        severity: 'high',
        message: `Elevated pulse (${p} bpm)`,
        rule: 'pulse_high',
        category: 'vitals'
      });
    } else if (p <= pulseThresh.critical_low) {
      flags.push({
        severity: 'critical',
        message: `CRITICAL: Severe bradycardia (${p} bpm) — URGENT REFERRAL`,
        rule: 'pulse_critical_low',
        category: 'vitals'
      });
    } else if (p <= pulseThresh.low) {
      flags.push({
        severity: 'high',
        message: `Low pulse (${p} bpm)`,
        rule: 'pulse_low',
        category: 'vitals'
      });
    }
  }
  
  // Respiratory rate checks
  const rr = parseInt(respRate);
  if (!isNaN(rr) && rr > 0) {
    const rrThresh = THRESHOLDS.respRate[ageGroup];
    
    if (rr >= rrThresh.critical) {
      flags.push({
        severity: 'critical',
        message: `CRITICAL: Severe tachypnea (${rr}/min)`,
        rule: 'resp_critical',
        category: 'respiratory'
      });
    } else if (rr >= rrThresh.high) {
      flags.push({
        severity: 'high',
        message: `Fast breathing (${rr}/min)`,
        rule: 'resp_high',
        category: 'respiratory'
      });
    }
  }
  
  // Danger sign pattern matching
  DANGER_PATTERNS.forEach(({ patterns, message, severity, category }) => {
    if (patterns.some(pattern => allText.includes(pattern))) {
      flags.push({
        severity,
        message,
        rule: `danger_${category}`,
        category
      });
    }
  });
  
  // Pregnancy-specific checks
  if (pregnant) {
    PREGNANCY_DANGERS.forEach(({ conditions, message, severity }) => {
      if (conditions.every(cond => allText.includes(cond))) {
        flags.push({
          severity,
          message,
          rule: 'pregnancy_danger',
          category: 'pregnancy'
        });
      }
    });
  }
  
  // Age-based special rules
  const ageNum = parseFloat(age);
  if (ageNum < 0.17 && allText.includes('fever')) { // Under 2 months
    flags.push({
      severity: 'critical',
      message: 'Fever in infant under 2 months — URGENT REFERRAL',
      rule: 'neonate_fever',
      category: 'age_specific'
    });
  }
  
  // Deduplicate by rule
  const seen = new Set();
  return flags.filter(f => {
    if (seen.has(f.rule)) return false;
    seen.add(f.rule);
    return true;
  });
}

// Get highest severity from flags
export function getHighestSeverity(flags) {
  if (flags.some(f => f.severity === 'critical')) return 'critical';
  if (flags.some(f => f.severity === 'high')) return 'high';
  if (flags.some(f => f.severity === 'medium')) return 'medium';
  return 'normal';
}

// Check if urgent referral needed
export function needsUrgentReferral(flags) {
  return flags.some(f => f.severity === 'critical');
}

// Group flags by category
export function groupFlagsByCategory(flags) {
  return flags.reduce((acc, flag) => {
    const cat = flag.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(flag);
    return acc;
  }, {});
}
```

---

## Step 2: Create Red Flag Banner Component

Create file `web/src/components/RedFlagBanner.jsx`:

### Copilot Prompt

```
@workspace Create a RedFlagBanner component that:
- Shows urgently when critical flags exist
- Displays count of each severity level
- Has expandable details section
- Uses red/yellow/orange colors by severity
- Has animated entrance
- Shows "URGENT REFERRAL" message prominently
```

### Expected Code

```jsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, ChevronDown, ChevronUp, Phone } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { needsUrgentReferral, groupFlagsByCategory } from '@/lib/redflags';

const SEVERITY_CONFIG = {
  critical: {
    color: 'bg-red-600',
    textColor: 'text-red-600',
    borderColor: 'border-red-600',
    bgLight: 'bg-red-50',
    icon: AlertTriangle,
    label: 'Critical'
  },
  high: {
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-500',
    bgLight: 'bg-orange-50',
    icon: AlertCircle,
    label: 'High'
  },
  medium: {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-500',
    bgLight: 'bg-yellow-50',
    icon: AlertCircle,
    label: 'Medium'
  }
};

export default function RedFlagBanner({ flags = [], showActions = true }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (flags.length === 0) return null;
  
  const isUrgent = needsUrgentReferral(flags);
  const grouped = groupFlagsByCategory(flags);
  
  const criticalCount = flags.filter(f => f.severity === 'critical').length;
  const highCount = flags.filter(f => f.severity === 'high').length;
  const mediumCount = flags.filter(f => f.severity === 'medium').length;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <Card className={`
        overflow-hidden border-2
        ${isUrgent ? 'border-red-600 bg-red-50' : 'border-yellow-500 bg-yellow-50'}
      `}>
        {/* Header */}
        <div 
          className={`
            p-4 cursor-pointer
            ${isUrgent ? 'bg-red-600 text-white' : 'bg-yellow-500 text-yellow-900'}
          `}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-lg">
                  {isUrgent ? 'URGENT REFERRAL NEEDED' : 'Warning Signs Detected'}
                </h3>
                <div className="flex gap-2 mt-1">
                  {criticalCount > 0 && (
                    <Badge className="bg-red-700">{criticalCount} Critical</Badge>
                  )}
                  {highCount > 0 && (
                    <Badge className="bg-orange-600">{highCount} High</Badge>
                  )}
                  {mediumCount > 0 && (
                    <Badge className="bg-yellow-600">{mediumCount} Medium</Badge>
                  )}
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className={isUrgent ? 'text-white hover:bg-red-700' : 'text-yellow-900 hover:bg-yellow-600'}
            >
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </div>
        
        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {/* Group by category */}
                {Object.entries(grouped).map(([category, categoryFlags]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">
                      {category}
                    </h4>
                    <div className="space-y-2">
                      {categoryFlags.map((flag, i) => {
                        const config = SEVERITY_CONFIG[flag.severity];
                        const Icon = config.icon;
                        
                        return (
                          <div 
                            key={i}
                            className={`
                              flex items-center gap-3 p-3 rounded-lg border
                              ${config.bgLight} ${config.borderColor}
                            `}
                          >
                            <Icon className={`w-5 h-5 ${config.textColor}`} />
                            <span className={`flex-1 ${config.textColor}`}>
                              {flag.message}
                            </span>
                            <Badge variant="secondary">
                              {config.label}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {/* Actions */}
                {showActions && isUrgent && (
                  <div className="pt-4 border-t border-red-200">
                    <p className="text-sm text-red-700 mb-3">
                      <strong>Immediate actions required:</strong> Arrange transport to nearest health facility. 
                      Stabilize patient during transport if trained.
                    </p>
                    <Button className="w-full bg-red-600 hover:bg-red-700">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Emergency Contact
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
```

---

## Step 3: Sync Server-Side Red Flags

Copy the same logic to `api/src/services/redflags.js` to ensure consistent behavior.

---

## Step 4: Test the Safety Engine

### Test Critical Cases

Create an encounter with:
- Temperature: 41°C (should trigger critical)
- Danger signs: "Convulsions" (should trigger critical)

Verify:
- Red banner appears immediately
- "URGENT REFERRAL" message shows
- Multiple flags display with correct severity

### Test Edge Cases

```javascript
// Test cases to verify
const testCases = [
  { temp: 40.0, expected: 'critical' },  // Exactly at threshold
  { temp: 39.9, expected: 'high' },      // Just below critical
  { pulse: 180, age: 0.02, expected: 'critical' }, // Neonate
  { pulse: 180, age: 5, expected: 'critical' },    // Child (different threshold)
];
```

---

## Validation Checklist

- [ ] Temperature ≥40°C triggers critical
- [ ] Temperature <35°C triggers critical
- [ ] Pulse thresholds vary by age correctly
- [ ] Danger sign keywords are detected
- [ ] Pregnancy rules work correctly
- [ ] Banner shows with animated entry
- [ ] Details expand/collapse
- [ ] Critical count is correct

---

## What You Learned

- How to implement rule-based safety checks
- How to use age-specific clinical thresholds
- How to pattern match for danger signs
- How to combine multiple safety signals
- How to display urgent information effectively

---

## Next Step

**Proceed to Lesson 10:** Stock Tracking

You'll implement medicine inventory management.

---

*Safety logic is solid. Now track the supplies. →*
