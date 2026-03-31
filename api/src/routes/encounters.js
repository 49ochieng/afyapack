const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/index');

const router = express.Router();

// Red-flag screening rules
function screenRedFlags(data) {
  const flags = [];

  const temp = parseFloat(data.temperature);
  const pulse = parseInt(data.pulse);
  const symptoms = Array.isArray(data.symptoms) ? data.symptoms.map(s => s.toLowerCase()) : [];
  const dangerSigns = Array.isArray(data.danger_signs) ? data.danger_signs.map(s => s.toLowerCase()) : [];
  const pregnant = Boolean(data.pregnant);

  // Temperature
  if (!isNaN(temp)) {
    if (temp >= 40.0) {
      flags.push({ severity: 'critical', message: `Dangerously high fever (${temp}°C) — URGENT REFERRAL`, rule: 'temp_critical' });
    } else if (temp >= 39.0) {
      flags.push({ severity: 'high', message: `High fever (${temp}°C) — assess for malaria, monitor closely`, rule: 'temp_high' });
    } else if (temp >= 38.5) {
      flags.push({ severity: 'medium', message: `Elevated temperature (${temp}°C) — give antipyretic, monitor`, rule: 'temp_medium' });
    } else if (temp < 35.5 && temp > 0) {
      flags.push({ severity: 'critical', message: `Hypothermia (${temp}°C) — URGENT REFERRAL`, rule: 'temp_low' });
    }
  }

  // Pulse
  if (!isNaN(pulse) && pulse > 0) {
    if (pulse > 130) {
      flags.push({ severity: 'critical', message: `Severe tachycardia (${pulse} bpm) — URGENT REFERRAL`, rule: 'pulse_critical' });
    } else if (pulse > 110) {
      flags.push({ severity: 'high', message: `Tachycardia (${pulse} bpm) — clinical review needed`, rule: 'pulse_high' });
    } else if (pulse < 50) {
      flags.push({ severity: 'critical', message: `Bradycardia (${pulse} bpm) — URGENT REFERRAL`, rule: 'pulse_low' });
    }
  }

  // Danger signs in free text
  const criticalKeywords = [
    { keywords: ['convulsion', 'seizure', 'fitting'], message: 'Convulsions/seizure reported — URGENT REFERRAL', rule: 'convulsion' },
    { keywords: ['unconscious', 'unresponsive', 'not waking'], message: 'Altered consciousness — URGENT REFERRAL', rule: 'consciousness' },
    { keywords: ['not breathing', 'stopped breathing', 'apnoea'], message: 'Respiratory emergency — URGENT REFERRAL', rule: 'breathing' },
    { keywords: ['severe bleeding', 'heavy bleeding', 'haemorrhage'], message: 'Severe bleeding — URGENT REFERRAL', rule: 'bleeding' },
    { keywords: ['unable to drink', 'not drinking', 'cannot feed'], message: 'Unable to feed/drink — assess urgently', rule: 'hydration' },
    { keywords: ['stiff neck', 'neck stiffness'], message: 'Stiff neck — possible meningitis, URGENT REFERRAL', rule: 'meningitis' },
    { keywords: ['bulging fontanelle'], message: 'Bulging fontanelle in infant — URGENT REFERRAL', rule: 'fontanelle' },
    { keywords: ['skin pinch', 'sunken eyes', 'severe dehydration'], message: 'Signs of dehydration — initiate ORT and assess severity', rule: 'dehydration_sign' },
  ];

  const allText = [...symptoms, ...dangerSigns].join(' ');
  criticalKeywords.forEach(({ keywords, message, rule }) => {
    if (keywords.some(kw => allText.includes(kw))) {
      flags.push({ severity: 'critical', message, rule });
    }
  });

  // Pregnancy-specific checks
  if (pregnant) {
    const maternalDangerSigns = [
      'headache', 'visual', 'blurred', 'swelling', 'oedema', 'epigastric', 'bleeding', 'discharge'
    ];
    const hasHeadacheAndSwelling = allText.includes('headache') && (allText.includes('swelling') || allText.includes('oedema'));
    if (hasHeadacheAndSwelling) {
      flags.push({ severity: 'critical', message: 'URGENT — Possible pre-eclampsia (headache + swelling in pregnancy). Refer immediately', rule: 'preeclampsia' });
    }
    if (allText.includes('headache') && (allText.includes('visual') || allText.includes('blurred'))) {
      flags.push({ severity: 'critical', message: 'Severe headache with visual disturbance in pregnancy — REFER NOW', rule: 'maternal_danger' });
    }
    if (allText.includes('bleeding') && !flags.some(f => f.rule === 'bleeding')) {
      flags.push({ severity: 'critical', message: 'Vaginal bleeding in pregnancy — URGENT REFERRAL', rule: 'maternal_bleeding' });
    }
  }

  // Deduplicate by rule
  const seen = new Set();
  return flags.filter(f => {
    if (seen.has(f.rule)) return false;
    seen.add(f.rule);
    return true;
  });
}

// GET /api/encounters — list recent encounters
router.get('/', (_req, res) => {
  try {
    const db = getDB();
    const rows = db.prepare(`
      SELECT id, age, sex, pregnant, symptoms, duration, temperature, pulse,
             danger_signs, notes, red_flags, status, created_at
      FROM encounters
      ORDER BY created_at DESC
      LIMIT 20
    `).all();

    const encounters = rows.map(r => ({
      ...r,
      symptoms: JSON.parse(r.symptoms || '[]'),
      danger_signs: JSON.parse(r.danger_signs || '[]'),
      red_flags: JSON.parse(r.red_flags || '[]'),
      pregnant: Boolean(r.pregnant),
    }));

    res.json(encounters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/encounters/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDB();
    const row = db.prepare('SELECT * FROM encounters WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Encounter not found' });

    res.json({
      ...row,
      symptoms: JSON.parse(row.symptoms || '[]'),
      danger_signs: JSON.parse(row.danger_signs || '[]'),
      red_flags: JSON.parse(row.red_flags || '[]'),
      pregnant: Boolean(row.pregnant),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/encounters — create new encounter
router.post('/', (req, res) => {
  try {
    const {
      age, sex, pregnant = false, symptoms = [], duration,
      temperature, pulse, danger_signs = [], notes = '',
    } = req.body;

    const id = `enc-${Date.now()}-${uuidv4().slice(0, 8)}`;
    const redFlags = screenRedFlags({ age, sex, pregnant, symptoms, temperature, pulse, danger_signs });

    const db = getDB();
    db.prepare(`
      INSERT INTO encounters
        (id, age, sex, pregnant, symptoms, duration, temperature, pulse, danger_signs, notes, red_flags, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `).run(
      id,
      age || null,
      sex || null,
      pregnant ? 1 : 0,
      JSON.stringify(Array.isArray(symptoms) ? symptoms : [symptoms]),
      duration || null,
      temperature || null,
      pulse || null,
      JSON.stringify(Array.isArray(danger_signs) ? danger_signs : [danger_signs]),
      notes,
      JSON.stringify(redFlags),
    );

    const encounter = db.prepare('SELECT * FROM encounters WHERE id = ?').get(id);
    res.status(201).json({
      ...encounter,
      symptoms: JSON.parse(encounter.symptoms),
      danger_signs: JSON.parse(encounter.danger_signs),
      red_flags: redFlags,
      pregnant: Boolean(encounter.pregnant),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/encounters/:id
router.patch('/:id', (req, res) => {
  try {
    const db = getDB();
    const existing = db.prepare('SELECT * FROM encounters WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const updates = { ...req.body };
    const redFlags = screenRedFlags({
      ...existing,
      ...updates,
      symptoms: updates.symptoms || JSON.parse(existing.symptoms),
      danger_signs: updates.danger_signs || JSON.parse(existing.danger_signs),
      pregnant: 'pregnant' in updates ? updates.pregnant : Boolean(existing.pregnant),
    });

    db.prepare(`
      UPDATE encounters SET
        age = COALESCE(?, age),
        sex = COALESCE(?, sex),
        pregnant = COALESCE(?, pregnant),
        symptoms = COALESCE(?, symptoms),
        duration = COALESCE(?, duration),
        temperature = COALESCE(?, temperature),
        pulse = COALESCE(?, pulse),
        danger_signs = COALESCE(?, danger_signs),
        notes = COALESCE(?, notes),
        red_flags = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      updates.age ?? null,
      updates.sex ?? null,
      'pregnant' in updates ? (updates.pregnant ? 1 : 0) : null,
      updates.symptoms ? JSON.stringify(updates.symptoms) : null,
      updates.duration ?? null,
      updates.temperature ?? null,
      updates.pulse ?? null,
      updates.danger_signs ? JSON.stringify(updates.danger_signs) : null,
      updates.notes ?? null,
      JSON.stringify(redFlags),
      req.params.id,
    );

    const updated = db.prepare('SELECT * FROM encounters WHERE id = ?').get(req.params.id);
    res.json({
      ...updated,
      symptoms: JSON.parse(updated.symptoms),
      danger_signs: JSON.parse(updated.danger_signs),
      red_flags: redFlags,
      pregnant: Boolean(updated.pregnant),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
