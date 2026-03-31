const express = require('express');
const { getDB } = require('../db/index');
const { getStatus } = require('../services/foundry');

const router = express.Router();

router.get('/', (_req, res) => {
  try {
    const db = getDB();
    const protocolCount = db.prepare('SELECT COUNT(*) as c FROM protocol_chunks').get()?.c || 0;
    const encounterCount = db.prepare('SELECT COUNT(*) as c FROM encounters').get()?.c || 0;
    const stockCount = db.prepare('SELECT COUNT(*) as c FROM stock').get()?.c || 0;
    const foundryStatus = getStatus();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      foundry: foundryStatus,
      db: {
        protocol_chunks: protocolCount,
        encounters: encounterCount,
        stock_items: stockCount,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

module.exports = router;
