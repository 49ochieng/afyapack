const express = require('express');
const { getDB } = require('../db/index');

const router = express.Router();

// GET /api/stock — list all stock items
router.get('/', (_req, res) => {
  try {
    const db = getDB();
    const items = db.prepare('SELECT * FROM stock ORDER BY category, name').all();
    res.json(items.map(item => ({
      ...item,
      is_low: item.quantity <= item.low_threshold,
      is_out: item.quantity === 0,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stock/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDB();
    const item = db.prepare('SELECT * FROM stock WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json({ ...item, is_low: item.quantity <= item.low_threshold, is_out: item.quantity === 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stock — add new stock item
router.post('/', (req, res) => {
  try {
    const { name, category = 'medicine', quantity = 0, unit = 'units', low_threshold = 10 } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const db = getDB();
    const result = db.prepare(`
      INSERT INTO stock (name, category, quantity, unit, low_threshold)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, category, quantity, unit, low_threshold);

    const item = db.prepare('SELECT * FROM stock WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ ...item, is_low: item.quantity <= item.low_threshold, is_out: item.quantity === 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/stock/:id — update quantity or details
router.patch('/:id', (req, res) => {
  try {
    const { name, category, quantity, unit, low_threshold } = req.body;
    const db = getDB();

    db.prepare(`
      UPDATE stock SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        quantity = COALESCE(?, quantity),
        unit = COALESCE(?, unit),
        low_threshold = COALESCE(?, low_threshold),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name ?? null, category ?? null, quantity ?? null, unit ?? null, low_threshold ?? null, req.params.id);

    const item = db.prepare('SELECT * FROM stock WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json({ ...item, is_low: item.quantity <= item.low_threshold, is_out: item.quantity === 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stock/:id/adjust — quick +/- adjustment
router.post('/:id/adjust', (req, res) => {
  try {
    const { delta } = req.body; // positive = add, negative = remove
    if (typeof delta !== 'number') return res.status(400).json({ error: 'delta must be a number' });

    const db = getDB();
    const item = db.prepare('SELECT * FROM stock WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    const newQty = Math.max(0, item.quantity + delta);
    db.prepare('UPDATE stock SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newQty, req.params.id);

    const updated = db.prepare('SELECT * FROM stock WHERE id = ?').get(req.params.id);
    res.json({ ...updated, is_low: updated.quantity <= updated.low_threshold, is_out: updated.quantity === 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/stock/:id
router.delete('/:id', (req, res) => {
  try {
    const db = getDB();
    const result = db.prepare('DELETE FROM stock WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
