const express = require('express');
const { getDB } = require('../db/index');
const { searchProtocols } = require('../services/retrieval');

const router = express.Router();

// GET /api/protocols — list all unique protocol documents
router.get('/', (_req, res) => {
  try {
    const db = getDB();
    const docs = db.prepare(`
      SELECT doc_id, doc_title, COUNT(*) as chunk_count, GROUP_CONCAT(DISTINCT tags) as tag_groups
      FROM protocol_chunks
      GROUP BY doc_id, doc_title
      ORDER BY doc_title
    `).all();

    const result = docs.map(d => ({
      id: d.doc_id,
      title: d.doc_title,
      chunk_count: d.chunk_count,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/protocols/:docId — get all chunks for a document
router.get('/:docId', (req, res) => {
  try {
    const db = getDB();
    const chunks = db.prepare(`
      SELECT id, doc_title, section, chunk_index, content, tags
      FROM protocol_chunks
      WHERE doc_id = ?
      ORDER BY chunk_index
    `).all(req.params.docId);

    if (chunks.length === 0) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    res.json({
      id: req.params.docId,
      title: chunks[0].doc_title,
      sections: chunks.map(c => ({
        id: c.id,
        section: c.section,
        content: c.content,
        tags: JSON.parse(c.tags || '[]'),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/protocols/search — full-text search
router.post('/search', (req, res) => {
  try {
    const { query, topK = 4 } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query is required' });
    }

    const results = searchProtocols(query.trim(), Number(topK));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
