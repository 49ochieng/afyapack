const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/index');
const { chat } = require('../services/foundry');
const { buildReferralPrompt } = require('../services/prompts');

const router = express.Router();

// GET /api/referrals/:encounterId — get referral for encounter
router.get('/:encounterId', (req, res) => {
  try {
    const db = getDB();
    const row = db.prepare(
      'SELECT * FROM referrals WHERE encounter_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(req.params.encounterId);

    if (!row) return res.status(404).json({ error: 'No referral found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/referrals — list all saved referrals
router.get('/', (_req, res) => {
  try {
    const db = getDB();
    const rows = db.prepare(
      'SELECT * FROM referrals ORDER BY created_at DESC LIMIT 20'
    ).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/referrals — generate a referral summary
router.post('/', async (req, res) => {
  try {
    const { encounter_id } = req.body;
    if (!encounter_id) return res.status(400).json({ error: 'encounter_id required' });

    const db = getDB();
    const encounter = db.prepare('SELECT * FROM encounters WHERE id = ?').get(encounter_id);
    if (!encounter) return res.status(404).json({ error: 'Encounter not found' });

    const enc = {
      ...encounter,
      symptoms: JSON.parse(encounter.symptoms || '[]'),
      danger_signs: JSON.parse(encounter.danger_signs || '[]'),
      red_flags: JSON.parse(encounter.red_flags || '[]'),
      pregnant: Boolean(encounter.pregnant),
    };

    // Get guidance text if available
    const guidance = db.prepare(
      'SELECT guidance_text FROM guidance WHERE encounter_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(encounter_id);

    const { systemPrompt, userPrompt } = buildReferralPrompt(enc, guidance?.guidance_text || '');
    const summaryText = await chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens: 400, temperature: 0.1 },
    );

    // Determine urgency from red flags
    const hasCritical = enc.red_flags.some(f => f.severity === 'critical');
    const urgency = hasCritical ? 'urgent' : 'routine';

    const id = `ref-${Date.now()}-${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO referrals (id, encounter_id, summary, urgency, saved)
      VALUES (?, ?, ?, ?, 0)
    `).run(id, encounter_id, summaryText, urgency);

    res.status(201).json({ id, encounter_id, summary: summaryText, urgency, saved: false });
  } catch (err) {
    console.error('[Referral] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/referrals/:id — update summary or mark as saved
router.patch('/:id', (req, res) => {
  try {
    const { summary, facility, saved } = req.body;
    const db = getDB();
    db.prepare(`
      UPDATE referrals SET
        summary = COALESCE(?, summary),
        facility = COALESCE(?, facility),
        saved = COALESCE(?, saved)
      WHERE id = ?
    `).run(summary ?? null, facility ?? null, saved !== undefined ? (saved ? 1 : 0) : null, req.params.id);

    const updated = db.prepare('SELECT * FROM referrals WHERE id = ?').get(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
