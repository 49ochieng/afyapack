/**
 * Client-side red-flag screening (mirrors server logic for instant UI feedback).
 */

export function screenRedFlags(encounter) {
  const flags = [];
  const { temperature, pulse, symptoms = [], danger_signs = [], pregnant, age } = encounter;

  const temp = parseFloat(temperature);
  const p = parseInt(pulse);
  const allText = [...symptoms, ...danger_signs].join(' ').toLowerCase();

  if (!isNaN(temp) && temp > 0) {
    if (temp >= 40.0) flags.push({ severity: 'critical', message: `Dangerously high fever (${temp}°C) — URGENT REFERRAL`, rule: 'temp_critical' });
    else if (temp >= 39.0) flags.push({ severity: 'high', message: `High fever (${temp}°C) — assess for malaria`, rule: 'temp_high' });
    else if (temp >= 38.5) flags.push({ severity: 'medium', message: `Elevated temperature (${temp}°C) — give antipyretic`, rule: 'temp_medium' });
    else if (temp < 35.5) flags.push({ severity: 'critical', message: `Hypothermia (${temp}°C) — URGENT REFERRAL`, rule: 'temp_low' });
  }

  if (!isNaN(p) && p > 0) {
    if (p > 130) flags.push({ severity: 'critical', message: `Severe tachycardia (${p} bpm) — URGENT REFERRAL`, rule: 'pulse_critical' });
    else if (p > 110) flags.push({ severity: 'high', message: `Tachycardia (${p} bpm) — clinical review`, rule: 'pulse_high' });
    else if (p < 50) flags.push({ severity: 'critical', message: `Bradycardia (${p} bpm) — URGENT REFERRAL`, rule: 'pulse_low' });
  }

  const criticals = [
    { kws: ['convulsion', 'seizure'], msg: 'Convulsions reported — URGENT REFERRAL', rule: 'convulsion' },
    { kws: ['unconscious', 'unresponsive'], msg: 'Altered consciousness — URGENT REFERRAL', rule: 'consciousness' },
    { kws: ['not breathing', 'apnoea'], msg: 'Respiratory emergency — URGENT REFERRAL', rule: 'breathing' },
    { kws: ['severe bleeding', 'haemorrhage'], msg: 'Severe bleeding — URGENT REFERRAL', rule: 'bleeding' },
    { kws: ['unable to drink', 'not drinking', 'cannot feed'], msg: 'Unable to feed/drink — assess urgently', rule: 'hydration' },
    { kws: ['stiff neck'], msg: 'Stiff neck — possible meningitis, URGENT REFERRAL', rule: 'meningitis' },
  ];

  criticals.forEach(({ kws, msg, rule }) => {
    if (kws.some(kw => allText.includes(kw))) {
      flags.push({ severity: 'critical', message: msg, rule });
    }
  });

  if (pregnant) {
    if (allText.includes('headache') && (allText.includes('swelling') || allText.includes('oedema'))) {
      flags.push({ severity: 'critical', message: 'URGENT — Possible pre-eclampsia. Refer immediately', rule: 'preeclampsia' });
    }
    if (allText.includes('headache') && (allText.includes('visual') || allText.includes('blurred'))) {
      flags.push({ severity: 'critical', message: 'Severe headache with visual disturbance in pregnancy — REFER NOW', rule: 'maternal_danger' });
    }
  }

  if (age < 5 && (allText.includes('sunken eyes') || allText.includes('skin pinch') || allText.includes('dehydration'))) {
    flags.push({ severity: 'high', message: 'Dehydration signs in child under 5 — assess and initiate ORT', rule: 'child_dehydration' });
  }

  const seen = new Set();
  return flags.filter(f => { if (seen.has(f.rule)) return false; seen.add(f.rule); return true; });
}

export function getHighestSeverity(flags) {
  if (!flags?.length) return null;
  if (flags.some(f => f.severity === 'critical')) return 'critical';
  if (flags.some(f => f.severity === 'high')) return 'high';
  if (flags.some(f => f.severity === 'medium')) return 'medium';
  return 'low';
}
