'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RedFlagBanner } from '@/components/RedFlagBanner';
import { screenRedFlags } from '@/lib/redflags';
import { ChevronRight, ChevronLeft, X, Plus, User, Stethoscope, Activity, AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const COMMON_SYMPTOMS = [
  'Fever', 'Cough', 'Diarrhoea', 'Vomiting', 'Headache',
  'Abdominal pain', 'Difficulty breathing', 'Rash', 'Sore throat',
  'Ear pain', 'Reduced feeding', 'Sunken eyes', 'Skin pinch slow',
  'Convulsions', 'Stiff neck', 'Blurred vision', 'Facial swelling',
  'Vaginal bleeding', 'Epigastric pain',
];

const DANGER_SIGN_OPTIONS = [
  'Convulsions or fitting',
  'Unconscious or unresponsive',
  'Unable to drink or feed',
  'Vomiting everything',
  'Severe difficulty breathing',
  'Stiff neck',
  'Bulging fontanelle (infant)',
  'Severe dehydration signs',
  'Heavy bleeding',
  'Altered mental status',
  'Sunken eyes',
  'Skin pinch returns very slowly',
];

const STEPS = [
  { label: 'Patient', icon: User, desc: 'Age, sex & pregnancy' },
  { label: 'Symptoms', icon: Stethoscope, desc: 'Presenting complaints' },
  { label: 'Vitals', icon: Activity, desc: 'Temperature & pulse' },
  { label: 'Danger Signs', icon: AlertTriangle, desc: 'Clinical red flags' },
];

export function EncounterForm({ onSubmit, loading }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    age: '', sex: '', pregnant: false,
    symptoms: [], symptomInput: '', duration: '',
    temperature: '', pulse: '', danger_signs: [], notes: '',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const liveFlags = screenRedFlags({
    ...form,
    age: parseInt(form.age) || 0,
    temperature: parseFloat(form.temperature),
    pulse: parseInt(form.pulse),
  });

  const addSymptom = (s) => {
    const val = s.trim();
    if (val && !form.symptoms.includes(val)) {
      set('symptoms', [...form.symptoms, val]);
      set('symptomInput', '');
    }
  };
  const removeSymptom = (s) => set('symptoms', form.symptoms.filter(x => x !== s));
  const toggleDangerSign = (s) => {
    const exists = form.danger_signs.includes(s);
    set('danger_signs', exists ? form.danger_signs.filter(x => x !== s) : [...form.danger_signs, s]);
  };

  const handleSubmit = () => {
    onSubmit({
      age: parseInt(form.age) || null,
      sex: form.sex || null,
      pregnant: form.pregnant,
      symptoms: form.symptoms,
      duration: form.duration,
      temperature: parseFloat(form.temperature) || null,
      pulse: parseInt(form.pulse) || null,
      danger_signs: form.danger_signs,
      notes: form.notes,
    });
  };

  const canNext = () => {
    if (step === 0) return form.age && form.sex;
    if (step === 1) return form.symptoms.length > 0;
    return true;
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="space-y-3">
        {/* Progress bar */}
        <div className="h-1 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step pills */}
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <button
                key={s.label}
                onClick={() => i < step && setStep(i)}
                disabled={i >= step}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-all duration-200 text-center',
                  active  ? 'bg-primary-light border border-primary/20' : '',
                  done    ? 'cursor-pointer hover:bg-secondary' : '',
                  !active && !done ? 'opacity-40' : '',
                )}
              >
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                  active ? 'bg-primary text-white' :
                  done   ? 'bg-emerald-500 text-white' :
                           'bg-secondary text-muted-foreground',
                )}>
                  {done
                    ? <Check size={11} strokeWidth={3} />
                    : <s.icon size={11} strokeWidth={2.5} />
                  }
                </div>
                <span className={cn(
                  'text-[9px] font-semibold uppercase tracking-wide hidden sm:block',
                  active ? 'text-primary' : done ? 'text-emerald-600' : 'text-muted-foreground',
                )}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Step description */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground">
            Step {step + 1} of {STEPS.length} — {STEPS[step].desc}
          </p>
        </div>
      </div>

      {/* Live red flags */}
      {liveFlags.length > 0 && <RedFlagBanner flags={liveFlags} />}

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && <PatientStep form={form} set={set} />}
          {step === 1 && <SymptomsStep form={form} set={set} addSymptom={addSymptom} removeSymptom={removeSymptom} />}
          {step === 2 && <VitalsStep form={form} set={set} />}
          {step === 3 && <DangerSignsStep form={form} toggleDangerSign={toggleDangerSign} />}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 pt-1">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
            <ChevronLeft size={16} />
            Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="flex-1">
            Continue
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading || form.symptoms.length === 0}
            size="lg"
            className="flex-1"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                Generate Guidance
                <ChevronRight size={16} />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function PatientStep({ form, set }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="age">Age (years) *</Label>
          <Input
            id="age" type="number" min="0" max="120" placeholder="e.g. 2"
            value={form.age} onChange={e => set('age', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sex">Sex *</Label>
          <Select id="sex" value={form.sex} onChange={e => set('sex', e.target.value)}>
            <option value="">Select sex</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
        </div>
      </div>

      {form.sex === 'female' && (
        <div className="space-y-1.5">
          <Label>Pregnancy status</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {[
              { val: false, label: 'Not pregnant' },
              { val: true, label: 'Pregnant' },
            ].map(({ val, label }) => (
              <button
                key={String(val)}
                onClick={() => set('pregnant', val)}
                className={cn(
                  'py-3 px-4 rounded-xl border text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2',
                  form.pregnant === val
                    ? val
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-primary-light border-primary/30 text-primary'
                    : 'bg-white border-border text-foreground hover:bg-secondary',
                )}
              >
                {form.pregnant === val && <Check size={14} strokeWidth={3} />}
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SymptomsStep({ form, set, addSymptom, removeSymptom }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Common symptoms — tap to add</Label>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_SYMPTOMS.map(s => {
            const selected = form.symptoms.includes(s);
            return (
              <button
                key={s}
                onClick={() => selected ? removeSymptom(s) : addSymptom(s)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150',
                  selected
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-border text-foreground hover:border-primary/40 hover:bg-primary-light',
                )}
              >
                {selected && <Check size={10} strokeWidth={3} className="inline mr-1" />}
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Add custom symptom</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Type symptom (English or Swahili)…"
            value={form.symptomInput}
            onChange={e => set('symptomInput', e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSymptom(form.symptomInput); } }}
          />
          <Button variant="outline" size="icon" onClick={() => addSymptom(form.symptomInput)} disabled={!form.symptomInput.trim()}>
            <Plus size={16} />
          </Button>
        </div>
      </div>

      {form.symptoms.length > 0 && (
        <div className="p-3 rounded-xl bg-primary-light border border-primary/20 space-y-2">
          <p className="text-xs font-semibold text-primary">{form.symptoms.length} symptom{form.symptoms.length > 1 ? 's' : ''} selected</p>
          <div className="flex flex-wrap gap-1.5">
            {form.symptoms.map(s => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20"
                onClick={() => removeSymptom(s)}
              >
                {s}
                <X size={10} />
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="duration">Duration of symptoms</Label>
        <Select id="duration" value={form.duration} onChange={e => set('duration', e.target.value)}>
          <option value="">Select duration</option>
          <option value="less than 1 day">Less than 1 day</option>
          <option value="1 day">1 day</option>
          <option value="2 days">2 days</option>
          <option value="3 days">3 days</option>
          <option value="4-7 days">4–7 days</option>
          <option value="more than 1 week">More than 1 week</option>
        </Select>
      </div>
    </div>
  );
}

function VitalsStep({ form, set }) {
  const tempVal = parseFloat(form.temperature);
  const pulseVal = parseInt(form.pulse);
  const tempStatus = !isNaN(tempVal)
    ? tempVal >= 40 ? { label: 'Critical fever', color: 'text-red-600 bg-red-50 border-red-200' }
    : tempVal >= 38.5 ? { label: 'Fever', color: 'text-amber-600 bg-amber-50 border-amber-200' }
    : tempVal < 35.5  ? { label: 'Hypothermia', color: 'text-blue-600 bg-blue-50 border-blue-200' }
    : { label: 'Normal', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' }
    : null;

  const pulseStatus = !isNaN(pulseVal)
    ? pulseVal > 130 ? { label: 'Severe tachycardia', color: 'text-red-600 bg-red-50 border-red-200' }
    : pulseVal > 110 ? { label: 'Tachycardia', color: 'text-amber-600 bg-amber-50 border-amber-200' }
    : pulseVal < 50  ? { label: 'Bradycardia', color: 'text-red-600 bg-red-50 border-red-200' }
    : { label: 'Normal', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' }
    : null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="temp">Temperature (°C)</Label>
          <Input
            id="temp" type="number" step="0.1" min="30" max="45" placeholder="e.g. 38.5"
            value={form.temperature} onChange={e => set('temperature', e.target.value)}
          />
          {tempStatus && (
            <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${tempStatus.color}`}>
              {tempStatus.label}
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pulse">Pulse rate (bpm)</Label>
          <Input
            id="pulse" type="number" min="20" max="250" placeholder="e.g. 95"
            value={form.pulse} onChange={e => set('pulse', e.target.value)}
          />
          {pulseStatus && (
            <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${pulseStatus.color}`}>
              {pulseStatus.label}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Clinical notes (optional)</Label>
        <Textarea
          id="notes" rows={3}
          placeholder="Additional observations, history, context…"
          value={form.notes} onChange={e => set('notes', e.target.value)}
        />
      </div>
    </div>
  );
}

function DangerSignsStep({ form, toggleDangerSign }) {
  const count = form.danger_signs.length;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Select any danger signs that are present. These trigger urgent clinical alerts.
      </p>

      {count > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle size={14} className="text-red-600 shrink-0" />
          <p className="text-xs font-semibold text-red-700">
            {count} danger sign{count > 1 ? 's' : ''} selected — urgent review required
          </p>
        </div>
      )}

      <div className="space-y-2">
        {DANGER_SIGN_OPTIONS.map(sign => {
          const checked = form.danger_signs.includes(sign);
          return (
            <button
              key={sign}
              onClick={() => toggleDangerSign(sign)}
              className={cn(
                'w-full flex items-center gap-3 p-3.5 rounded-xl border text-left text-sm font-medium transition-all duration-150',
                checked
                  ? 'bg-red-50 border-red-300 text-red-800'
                  : 'bg-white border-border text-foreground hover:bg-secondary',
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all',
                checked ? 'bg-red-600 border-red-600' : 'border-border bg-white',
              )}>
                {checked && <Check size={11} strokeWidth={3} className="text-white" />}
              </div>
              {sign}
            </button>
          );
        })}
      </div>
    </div>
  );
}
