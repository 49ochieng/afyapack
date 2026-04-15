# Prompt: Multi-Step Form Patterns

## Description
Create reusable patterns for multi-step forms with validation, state management, and progress indication.

---

## The Prompt

```
Create a React multi-step form system with:
1. useMultiStepForm hook for state management
2. Step indicator component showing progress
3. Navigation (next/back) with validation per step
4. Form data persisted across steps
5. Final review step before submission
6. Loading state during submission
7. Error handling per step
8. Keyboard navigation support (Enter to proceed)

Use Tailwind CSS. Make it accessible.
```

---

## Expected Output

### useMultiStepForm.js
```javascript
import { useState, useCallback } from 'react';

export function useMultiStepForm(steps, initialData = {}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);
  
  const updateFields = useCallback((fields) => {
    setFormData(prev => ({ ...prev, ...fields }));
  }, []);
  
  const validateStep = useCallback(() => {
    const step = steps[currentStep];
    if (!step.validate) return true;
    
    const stepErrors = step.validate(formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return false;
    }
    
    setErrors({});
    return true;
  }, [currentStep, formData, steps]);
  
  const next = useCallback(() => {
    if (!validateStep()) return false;
    
    if (!isLastStep) {
      setCurrentStep(prev => prev + 1);
      return true;
    }
    return false;
  }, [isLastStep, validateStep]);
  
  const back = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
    }
  }, [isFirstStep]);
  
  const goToStep = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setCurrentStep(stepIndex);
      setErrors({});
    }
  }, [totalSteps]);
  
  const reset = useCallback(() => {
    setCurrentStep(0);
    setFormData(initialData);
    setErrors({});
    setIsSubmitting(false);
  }, [initialData]);
  
  return {
    // State
    currentStep,
    totalSteps,
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    
    // Computed
    isFirstStep,
    isLastStep,
    progress,
    currentStepConfig: steps[currentStep],
    
    // Actions
    updateField,
    updateFields,
    validateStep,
    next,
    back,
    goToStep,
    reset
  };
}
```

### StepIndicator.jsx
```jsx
'use client';

import { Check } from 'lucide-react';

export default function StepIndicator({ steps, currentStep, onStepClick }) {
  return (
    <nav aria-label="Form progress" className="mb-8">
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 rounded-full mb-4">
        <div 
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
      
      {/* Step labels */}
      <ol className="flex justify-between">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <li 
              key={step.id}
              className="flex flex-col items-center"
            >
              <button
                onClick={() => onStepClick?.(index)}
                disabled={index > currentStep}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  text-sm font-medium transition-colors
                  ${isComplete 
                    ? 'bg-blue-600 text-white' 
                    : isCurrent
                      ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-600'
                      : 'bg-gray-100 text-gray-400'}
                  ${index <= currentStep ? 'cursor-pointer hover:bg-blue-500 hover:text-white' : 'cursor-not-allowed'}
                `}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isComplete ? <Check className="w-4 h-4" /> : index + 1}
              </button>
              <span className={`
                mt-2 text-xs font-medium
                ${isCurrent ? 'text-blue-600' : 'text-gray-500'}
              `}>
                {step.title}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

### FormNavigation.jsx
```jsx
'use client';

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function FormNavigation({
  onBack,
  onNext,
  onSubmit,
  isFirstStep,
  isLastStep,
  isSubmitting,
  nextLabel = 'Continue',
  submitLabel = 'Submit',
  backLabel = 'Back'
}) {
  return (
    <div className="flex justify-between pt-6 border-t">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        disabled={isFirstStep || isSubmitting}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg
          text-gray-600 hover:bg-gray-100
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        `}
      >
        <ChevronLeft className="w-4 h-4" />
        {backLabel}
      </button>
      
      {/* Next/Submit button */}
      {isLastStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="
            flex items-center gap-2 px-6 py-2 rounded-lg
            bg-green-600 text-white hover:bg-green-700
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            submitLabel
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="
            flex items-center gap-2 px-6 py-2 rounded-lg
            bg-blue-600 text-white hover:bg-blue-700
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {nextLabel}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
```

---

## Complete Example

```jsx
'use client';

import { useMultiStepForm } from '@/hooks/useMultiStepForm';
import StepIndicator from '@/components/StepIndicator';
import FormNavigation from '@/components/FormNavigation';

const STEPS = [
  {
    id: 'patient',
    title: 'Patient Info',
    validate: (data) => {
      const errors = {};
      if (!data.age || data.age < 0) errors.age = 'Valid age required';
      return errors;
    }
  },
  {
    id: 'symptoms',
    title: 'Symptoms',
    validate: (data) => {
      const errors = {};
      if (!data.symptoms?.length) errors.symptoms = 'Select at least one symptom';
      return errors;
    }
  },
  {
    id: 'vitals',
    title: 'Vitals',
    validate: () => ({})  // Optional step
  },
  {
    id: 'review',
    title: 'Review',
    validate: () => ({})
  }
];

export default function EncounterForm() {
  const form = useMultiStepForm(STEPS, { symptoms: [] });
  
  const handleSubmit = async () => {
    form.setIsSubmitting(true);
    try {
      const response = await fetch('/api/encounters', {
        method: 'POST',
        body: JSON.stringify(form.formData)
      });
      // Handle success
    } catch (err) {
      // Handle error
    } finally {
      form.setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <StepIndicator 
        steps={STEPS} 
        currentStep={form.currentStep}
        onStepClick={form.goToStep}
      />
      
      {/* Step content */}
      <div className="min-h-[300px]">
        {form.currentStep === 0 && (
          <PatientStep form={form} />
        )}
        {form.currentStep === 1 && (
          <SymptomsStep form={form} />
        )}
        {form.currentStep === 2 && (
          <VitalsStep form={form} />
        )}
        {form.currentStep === 3 && (
          <ReviewStep form={form} />
        )}
      </div>
      
      <FormNavigation
        onBack={form.back}
        onNext={form.next}
        onSubmit={handleSubmit}
        isFirstStep={form.isFirstStep}
        isLastStep={form.isLastStep}
        isSubmitting={form.isSubmitting}
      />
    </div>
  );
}
```

---

## Variations

### With Persistence
```
Add localStorage persistence to useMultiStepForm so users can return to incomplete forms.
```

### With Branching
```
Create a multi-step form that conditionally shows different steps based on previous answers (branching logic).
```

### With File Upload
```
Add a file upload step with drag-and-drop, preview, and progress indication.
```
