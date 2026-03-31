const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/index');
const { searchProtocols } = require('../services/retrieval');
const { chat } = require('../services/foundry');
const { buildGuidancePrompt } = require('../services/prompts');

const router = express.Router();

// GET /api/guidance/:encounterId — get existing guidance for an encounter
router.get('/:encounterId', (req, res) => {
  try {
    const db = getDB();
    const row = db.prepare(
      'SELECT * FROM guidance WHERE encounter_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(req.params.encounterId);

    if (!row) return res.status(404).json({ error: 'No guidance found for this encounter' });

    res.json({
      ...row,
      citations: JSON.parse(row.citations || '[]'),
      escalation_needed: Boolean(row.escalation_needed),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/guidance — generate grounded guidance for an encounter
router.post('/', async (req, res) => {
  try {
    const { encounter_id } = req.body;
    if (!encounter_id) {
      return res.status(400).json({ error: 'encounter_id is required' });
    }

    const db = getDB();
    const encounter = db.prepare('SELECT * FROM encounters WHERE id = ?').get(encounter_id);
    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }

    // Parse encounter
    const enc = {
      ...encounter,
      symptoms: JSON.parse(encounter.symptoms || '[]'),
      danger_signs: JSON.parse(encounter.danger_signs || '[]'),
      red_flags: JSON.parse(encounter.red_flags || '[]'),
      pregnant: Boolean(encounter.pregnant),
    };

    // Build search query from patient presentation
    const searchQuery = [
      ...enc.symptoms,
      enc.pregnant ? 'maternal pregnancy' : '',
      enc.age < 5 ? 'child paediatric' : '',
      enc.danger_signs.join(' '),
    ].filter(Boolean).join(' ');

    // Retrieve relevant protocol chunks
    const retrievedChunks = searchProtocols(searchQuery, 4);

    // Build prompts
    const { systemPrompt, userPrompt } = buildGuidancePrompt(enc, retrievedChunks);

    // Call local AI
    const guidanceText = await chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens: 700, temperature: 0.2 },
    );

    // Determine if escalation is needed
    const escalationNeeded =
      enc.red_flags.some(f => f.severity === 'critical') ||
      guidanceText.toLowerCase().includes('urgent') ||
      guidanceText.toLowerCase().includes('refer immediately');

    // Build citations
    const citations = retrievedChunks.map(c => ({
      id: c.id,
      doc_id: c.doc_id,
      title: c.doc_title,
      section: c.section,
      score: c.score,
    }));

    // Extract safety note
    const safetyMatch = guidanceText.match(/\*\*Safety Note\*\*\n(.*?)(?:\n\n|$)/s);
    const safetyNote = safetyMatch
      ? safetyMatch[1].trim()
      : '⚠️ This is protocol-based decision support only. It does not replace clinical assessment.';

    // Save guidance
    const id = `guid-${Date.now()}-${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO guidance (id, encounter_id, guidance_text, citations, safety_note, escalation_needed)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      encounter_id,
      guidanceText,
      JSON.stringify(citations),
      safetyNote,
      escalationNeeded ? 1 : 0,
    );

    res.status(201).json({
      id,
      encounter_id,
      guidance_text: guidanceText,
      citations,
      safety_note: safetyNote,
      escalation_needed: escalationNeeded,
      retrieved_chunks: retrievedChunks,
    });
  } catch (err) {
    console.error('[Guidance] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
