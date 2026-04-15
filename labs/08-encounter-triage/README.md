# Lesson 08: Encounter Triage

> Build the 4-step patient intake form with progressive disclosure.

---

## Lesson Overview

| | |
|---|---|
| **Duration** | 45 minutes |
| **Objective** | Create a multi-step form with validation and red flag detection |
| **Output** | Working encounter form that creates records and shows alerts |
| **Prerequisites** | Lesson 07 (Retrieval & grounding complete) |
| **Files/Folders** | `web/src/components/EncounterForm.jsx`, `web/src/app/encounter/` |

---

## What We're Building

```
Step 1: Demographics          Step 2: Symptoms
┌────────────────────┐        ┌────────────────────┐
│ Age: [___] years   │        │ □ Fever            │
│ Sex: ( )M ( )F     │   ───► │ □ Cough            │
│ Pregnant: □        │        │ □ Diarrhea         │
└────────────────────┘        │ Duration: [____]   │
                              └────────────────────┘
                                       │
                                       ▼
Step 3: Vitals                Step 4: Danger Signs
┌────────────────────┐        ┌────────────────────┐
│ Temp: [___]°C      │        │ □ Convulsions      │
│ Pulse: [___] bpm   │   ───► │ □ Unable to drink  │
│ ⚠️ High fever!     │        │ □ Unconscious      │
└────────────────────┘        │ Notes: [________]  │
                              └────────────────────┘
                                       │
                                       ▼
                              ┌────────────────────┐
                              │ ⚠️ RED FLAGS       │
                              │ - Critical fever   │
                              │ - Danger signs     │
                              │ [Get Guidance →]   │
                              └────────────────────┘
```

---

## Step 1: Create Form State Hook

Create file `web/src/hooks/useEncounterForm.js`:

### Copilot Prompt

```
@workspace Create a custom React hook useEncounterForm that:
- Manages encounter data state with all fields
- Tracks current step (1-4)
- Has functions: nextStep, prevStep, updateField, reset
- Validates each step before allowing next
- Returns computed red flags based on current values
```

### Expected Code

```javascript
'use client';

import { useState, useMemo, useCallback } from 'react';

const INITIAL_STATE = {
  age: '',
  sex: '',
  pregnant: false,
  symptoms: [],
  duration: '',
  temperature: '',
  pulse: '',
  danger_signs: [],
  notes: '',
};

const SYMPTOM_OPTIONS = [
  'Fever', 'Cough', 'Diarrhea', 'Vomiting', 'Headache',
  'Rash', 'Abdominal pain', 'Difficulty breathing', 'Loss of appetite',
  'Weakness', 'Sore throat', 'Runny nose'
];

const DANGER_SIGN_OPTIONS = [
  'Convulsions', 'Unable to drink', 'Unable to breastfeed',
  'Vomiting everything', 'Unconscious', 'Very sleepy/difficult to wake',
  'Severe bleeding', 'Stiff neck', 'Bulging fontanelle'
];

export default function useEncounterForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update a single field
  const updateField = useCallback((field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  // Toggle item in array field
  const toggleArrayItem = useCallback((field, item) => {
    setData(prev => {
      const arr = prev[field] || [];
      return {
        ...prev,
        [field]: arr.includes(item) 
          ? arr.filter(i => i !== item)
          : [...arr, item]
      };
    });
  }, []);
  
  // Validate current step
  const validateStep = useCallback((stepNum) => {
    switch (stepNum) {
      case 1:
        return data.age && data.sex;
      case 2:
        return data.symptoms.length > 0 || data.duration;
      case 3:
        return true; // Vitals are optional
      case 4:
        return true; // Danger signs are optional
      default:
        return true;
    }
  }, [data]);
  
  // Step navigation
  const nextStep = useCallback(() => {
    if (validateStep(step) && step < 4) {
      setStep(s => s + 1);
    }
  }, [step, validateStep]);
  
  const prevStep = useCallback(() => {
    if (step > 1) setStep(s => s - 1);
  }, [step]);
  
  const goToStep = useCallback((s) => {
    if (s >= 1 && s <= 4) setStep(s);
  }, []);
  
  // Compute red flags
  const redFlags = useMemo(() => {
    const flags = [];
    const temp = parseFloat(data.temperature);
    const pulse = parseInt(data.pulse);
    
    // Temperature checks
    if (!isNaN(temp) && temp > 0) {
      if (temp >= 40.0) {
        flags.push({ severity: 'critical', message: `Dangerously high fever (${temp}°C)`, rule: 'temp_critical' });
      } else if (temp >= 39.0) {
        flags.push({ severity: 'high', message: `High fever (${temp}°C)`, rule: 'temp_high' });
      } else if (temp < 35.5) {
        flags.push({ severity: 'critical', message: `Hypothermia (${temp}°C)`, rule: 'temp_low' });
      }
    }
    
    // Pulse checks 
    if (!isNaN(pulse) && pulse > 0) {
      if (pulse > 130) {
        flags.push({ severity: 'critical', message: `Severe tachycardia (${pulse} bpm)`, rule: 'pulse_critical' });
      } else if (pulse > 110) {
        flags.push({ severity: 'high', message: `Elevated pulse (${pulse} bpm)`, rule: 'pulse_high' });
      } else if (pulse < 50) {
        flags.push({ severity: 'critical', message: `Bradycardia (${pulse} bpm)`, rule: 'pulse_low' });
      }
    }
    
    // Danger signs
    const criticalSigns = ['Convulsions', 'Unable to drink', 'Unconscious', 'Severe bleeding'];
    data.danger_signs.forEach(sign => {
      if (criticalSigns.includes(sign)) {
        flags.push({ severity: 'critical', message: sign, rule: 'danger_sign' });
      }
    });
    
    // Pregnancy + headache
    if (data.pregnant && data.symptoms.includes('Headache')) {
      flags.push({ severity: 'high', message: 'Pregnant patient with headache - check for pre-eclampsia', rule: 'preeclampsia' });
    }
    
    return flags;
  }, [data]);
  
  // Reset form
  const reset = useCallback(() => {
    setData(INITIAL_STATE);
    setStep(1);
    setIsSubmitting(false);
  }, []);
  
  return {
    step,
    data,
    redFlags,
    isSubmitting,
    setIsSubmitting,
    updateField,
    toggleArrayItem,
    validateStep,
    nextStep,
    prevStep,
    goToStep,
    reset,
    SYMPTOM_OPTIONS,
    DANGER_SIGN_OPTIONS,
  };
}
```

---

## Step 2: Create the Encounter Form Component

Create file `web/src/components/EncounterForm.jsx`:

### Copilot Prompt

```
@workspace Create a React EncounterForm component with:
- 4 steps: Demographics, Symptoms, Vitals, Danger Signs
- Progress indicator at top
- Previous/Next/Submit buttons
- Uses the useEncounterForm hook
- Shows red flag alerts as they appear
- Submits to POST /api/encounters
- After submit, redirects to guidance page
```

### Expected Code

```jsx
'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, AlertTriangle, Send, User, Thermometer, AlertCircle, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import useEncounterForm from '@/hooks/useEncounterForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const STEP_INFO = [
  { title: 'Demographics', icon: User },
  { title: 'Symptoms', icon: FileText },
  { title: 'Vitals', icon: Thermometer },
  { title: 'Danger Signs', icon: AlertCircle },
];

export default function EncounterForm() {
  const router = useRouter();
  const {
    step, data, redFlags, isSubmitting, setIsSubmitting,
    updateField, toggleArrayItem, validateStep,
    nextStep, prevStep, reset,
    SYMPTOM_OPTIONS, DANGER_SIGN_OPTIONS,
  } = useEncounterForm();
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/api/encounters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: parseInt(data.age),
          sex: data.sex,
          pregnant: data.pregnant,
          symptoms: data.symptoms,
          duration: data.duration,
          temperature: data.temperature ? parseFloat(data.temperature) : null,
          pulse: data.pulse ? parseInt(data.pulse) : null,
          danger_signs: data.danger_signs,
          notes: data.notes,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create encounter');
      
      const encounter = await response.json();
      router.push(`/guidance/${encounter.id}`);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to create encounter. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {STEP_INFO.map((info, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isComplete = step > stepNum;
          
          return (
            <div key={i} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${isActive ? 'bg-blue-500 text-white' : 
                  isComplete ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
              `}>
                <info.icon className="w-5 h-5" />
              </div>
              {i < 3 && (
                <div className={`w-12 h-1 mx-2 ${isComplete ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Step Title */}
      <h2 className="text-xl font-semibold mb-4">
        Step {step}: {STEP_INFO[step - 1].title}
      </h2>
      
      {/* Red Flag Alerts */}
      {redFlags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Card className="border-red-300 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
              <AlertTriangle className="w-5 h-5" />
              Red Flags Detected
            </div>
            <div className="space-y-1">
              {redFlags.map((flag, i) => (
                <Badge 
                  key={i} 
                  variant={flag.severity === 'critical' ? 'destructive' : 'secondary'}
                >
                  {flag.message}
                </Badge>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
      
      {/* Form Steps */}
      <Card className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <StepDemographics 
                data={data} 
                updateField={updateField} 
              />
            )}
            {step === 2 && (
              <StepSymptoms
                data={data}
                toggleArrayItem={toggleArrayItem}
                updateField={updateField}
                options={SYMPTOM_OPTIONS}
              />
            )}
            {step === 3 && (
              <StepVitals
                data={data}
                updateField={updateField}
              />
            )}
            {step === 4 && (
              <StepDangerSigns
                data={data}
                toggleArrayItem={toggleArrayItem}
                updateField={updateField}
                options={DANGER_SIGN_OPTIONS}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </Card>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        
        {step < 4 ? (
          <Button
            onClick={nextStep}
            disabled={!validateStep(step)}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Get Guidance'}
            <Send className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Step 1: Demographics
function StepDemographics({ data, updateField }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="age">Age (years)</Label>
        <Input
          id="age"
          type="number"
          min="0"
          max="120"
          value={data.age}
          onChange={(e) => updateField('age', e.target.value)}
          placeholder="Enter age"
        />
      </div>
      
      <div>
        <Label>Sex</Label>
        <div className="flex gap-4 mt-2">
          {['male', 'female'].map(sex => (
            <label key={sex} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sex"
                value={sex}
                checked={data.sex === sex}
                onChange={(e) => updateField('sex', e.target.value)}
                className="w-4 h-4"
              />
              {sex.charAt(0).toUpperCase() + sex.slice(1)}
            </label>
          ))}
        </div>
      </div>
      
      {data.sex === 'female' && parseInt(data.age) >= 12 && (
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.pregnant}
              onChange={(e) => updateField('pregnant', e.target.checked)}
              className="w-4 h-4"
            />
            Currently pregnant
          </label>
        </div>
      )}
    </div>
  );
}

// Step 2: Symptoms
function StepSymptoms({ data, toggleArrayItem, updateField, options }) {
  return (
    <div className="space-y-4">
      <Label>Select all symptoms present</Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map(symptom => (
          <label
            key={symptom}
            className={`
              flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition
              ${data.symptoms.includes(symptom) 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'}
            `}
          >
            <input
              type="checkbox"
              checked={data.symptoms.includes(symptom)}
              onChange={() => toggleArrayItem('symptoms', symptom)}
              className="w-4 h-4"
            />
            {symptom}
          </label>
        ))}
      </div>
      
      <div>
        <Label htmlFor="duration">Duration</Label>
        <Input
          id="duration"
          value={data.duration}
          onChange={(e) => updateField('duration', e.target.value)}
          placeholder="e.g., 3 days, since yesterday"
        />
      </div>
    </div>
  );
}

// Step 3: Vitals
function StepVitals({ data, updateField }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Enter vital signs if measured. Leave blank if not taken.
      </p>
      
      <div>
        <Label htmlFor="temperature">Temperature (°C)</Label>
        <Input
          id="temperature"
          type="number"
          step="0.1"
          min="30"
          max="45"
          value={data.temperature}
          onChange={(e) => updateField('temperature', e.target.value)}
          placeholder="e.g., 38.5"
        />
      </div>
      
      <div>
        <Label htmlFor="pulse">Pulse (beats per minute)</Label>
        <Input
          id="pulse"
          type="number"
          min="30"
          max="200"
          value={data.pulse}
          onChange={(e) => updateField('pulse', e.target.value)}
          placeholder="e.g., 90"
        />
      </div>
    </div>
  );
}

// Step 4: Danger Signs
function StepDangerSigns({ data, toggleArrayItem, updateField, options }) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Important:</strong> Any danger sign requires urgent attention.
        </p>
      </div>
      
      <Label>Check any danger signs present</Label>
      <div className="space-y-2">
        {options.map(sign => (
          <label
            key={sign}
            className={`
              flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition
              ${data.danger_signs.includes(sign) 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-200 hover:border-gray-300'}
            `}
          >
            <input
              type="checkbox"
              checked={data.danger_signs.includes(sign)}
              onChange={() => toggleArrayItem('danger_signs', sign)}
              className="w-4 h-4"
            />
            {sign}
          </label>
        ))}
      </div>
      
      <div>
        <Label htmlFor="notes">Additional Notes</Label>
        <textarea
          id="notes"
          value={data.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Any other observations or context..."
          className="w-full p-3 border rounded-lg min-h-[100px] resize-none"
        />
      </div>
    </div>
  );
}
```

---

## Step 3: Create the Encounter Page

Create file `web/src/app/encounter/page.js`:

```jsx
import EncounterForm from '@/components/EncounterForm';

export const metadata = {
  title: 'New Encounter | AfyaPack',
};

export default function EncounterPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold text-center mb-8">
          Patient Triage
        </h1>
        <EncounterForm />
      </div>
    </div>
  );
}
```

---

## Step 4: Create the Guidance Display Page

Create file `web/src/app/guidance/[id]/page.js`:

### Copilot Prompt

```
@workspace Create a dynamic Next.js page for /guidance/[id] that:
- Fetches encounter by ID from API
- Calls POST /api/guidance with encounterId
- Shows loading state while generating
- Displays the AI guidance with citations
- Has prominent red flag warnings at top
- Shows "Back to Triage" and "New Encounter" buttons
```

### Expected Code

```jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Plus, Clock, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function GuidancePage() {
  const router = useRouter();
  const params = useParams();
  const encounterId = params.id;
  
  const [encounter, setEncounter] = useState(null);
  const [guidance, setGuidance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch encounter
        const encRes = await fetch(`${API_URL}/api/encounters/${encounterId}`);
        if (!encRes.ok) throw new Error('Encounter not found');
        const enc = await encRes.json();
        setEncounter(enc);
        
        // Generate guidance
        const guidRes = await fetch(`${API_URL}/api/guidance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ encounterId }),
        });
        
        if (!guidRes.ok) throw new Error('Failed to generate guidance');
        const guid = await guidRes.json();
        setGuidance(guid);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [encounterId]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Generating clinical guidance...</p>
          <p className="text-sm text-gray-400 mt-2">Analyzing protocols and patient data</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/encounter')}>
            New Encounter
          </Button>
        </Card>
      </div>
    );
  }
  
  const redFlags = encounter?.red_flags || [];
  const hasCritical = redFlags.some(f => f.severity === 'critical');
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push('/encounter')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Clinical Guidance</h1>
        </div>
        
        {/* Critical Alert Banner */}
        {hasCritical && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-red-600 text-white p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 shrink-0" />
                <div>
                  <h2 className="font-bold text-lg">URGENT REFERRAL NEEDED</h2>
                  <p>Critical signs detected. Arrange immediate transport to health facility.</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
        
        {/* Patient Summary */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Patient Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Age:</span> {encounter?.age} years</div>
            <div><span className="text-gray-500">Sex:</span> {encounter?.sex}</div>
            {encounter?.temperature && (
              <div><span className="text-gray-500">Temp:</span> {encounter.temperature}°C</div>
            )}
            {encounter?.pulse && (
              <div><span className="text-gray-500">Pulse:</span> {encounter.pulse} bpm</div>
            )}
          </div>
          {encounter?.symptoms?.length > 0 && (
            <div className="mt-2">
              <span className="text-gray-500 text-sm">Symptoms: </span>
              {encounter.symptoms.map((s, i) => (
                <Badge key={i} variant="secondary" className="mr-1">{s}</Badge>
              ))}
            </div>
          )}
        </Card>
        
        {/* Red Flags */}
        {redFlags.length > 0 && (
          <Card className="p-4 mb-6 border-yellow-300 bg-yellow-50">
            <h3 className="font-semibold text-yellow-800 mb-2">Red Flags Identified</h3>
            <div className="space-y-1">
              {redFlags.map((flag, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Badge variant={flag.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {flag.severity}
                  </Badge>
                  <span className="text-sm">{flag.message}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
        
        {/* AI Guidance */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">AI-Assisted Guidance</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              {guidance?.durationMs}ms
            </div>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap">
              {guidance?.guidance}
            </div>
          </div>
          
          {/* Citations */}
          {guidance?.citations?.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Sources</h4>
              <div className="flex flex-wrap gap-2">
                {guidance.citations.map((cite, i) => (
                  <Badge key={i} variant="outline">
                    {cite.docTitle || cite.title} — {cite.section}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Model info */}
          <div className="mt-4 pt-4 border-t text-xs text-gray-400">
            Generated by {guidance?.model} ({guidance?.source})
          </div>
        </Card>
        
        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/encounter')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Triage
          </Button>
          <Button
            className="flex-1"
            onClick={() => router.push('/encounter')}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Encounter
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## Step 5: Test the Full Flow

1. Start both servers
2. Go to `http://localhost:3000/encounter`
3. Fill in all 4 steps
4. Click "Get Guidance"
5. See the AI-generated guidance with citations

---

## Validation Checklist

- [ ] All 4 steps render correctly
- [ ] Red flags appear in real-time when entering high vitals
- [ ] Form validates before allowing next step
- [ ] Submission creates encounter in database
- [ ] Guidance page shows loading state
- [ ] AI guidance appears with citations
- [ ] Critical alerts display prominently

---

## What You Learned

- How to build multi-step forms with React
- How to implement progressive disclosure
- How to show real-time validation feedback
- How to connect forms to API endpoints
- How to display AI results with context

---

## Next Step

**Proceed to Lesson 09:** Red Flag Engine

You'll expand the rule-based safety screening system.

---

*Triage flow complete. Time to strengthen safety. →*
