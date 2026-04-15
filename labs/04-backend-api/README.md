# Lesson 04: Backend API

> Build the Express routes with database integration.

---

## Lesson Overview

| | |
|---|---|
| **Duration** | 40 minutes |
| **Objective** | Create REST API endpoints with SQLite database |
| **Output** | Working API with health, protocols, encounters routes |
| **Prerequisites** | Lesson 03 (Project scaffolding complete) |
| **Files/Folders** | `api/src/routes/`, `api/src/db/` |

---

## What We're Building

```
API Endpoints:
├── GET  /api/health          → System health check
├── GET  /api/protocols       → List all protocols
├── POST /api/protocols/search → Search protocol chunks
├── GET  /api/encounters      → List encounters
├── POST /api/encounters      → Create encounter
├── GET  /api/encounters/:id  → Get one encounter
├── POST /api/guidance        → Generate AI guidance
├── POST /api/referrals       → Generate referral note
└── GET/PUT /api/stock        → Stock management
```

---

## Step 1: Database Setup

### Create the Database Module

Create file `api/src/db/index.js`:

### Copilot Prompt

```
@workspace Create a SQLite database module using better-sqlite3 with:
- In-memory database (for development)
- Schema with tables: encounters, protocol_chunks, guidance, referrals, stock_items
- Encounters table: id, age, sex, pregnant, symptoms (JSON), temperature, pulse, danger_signs (JSON), notes, red_flags (JSON), created_at
- Protocol_chunks table: id, doc_id, doc_title, section, chunk_index, content, tokens (JSON), tfidf_vector (JSON), tags (JSON)
- Functions: initDB(), getDB()
```

### Expected Code (api/src/db/index.js)

```javascript
const Database = require('better-sqlite3');

let db = null;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS encounters (
    id TEXT PRIMARY KEY,
    age INTEGER,
    sex TEXT,
    pregnant INTEGER DEFAULT 0,
    symptoms TEXT,
    duration TEXT,
    temperature REAL,
    pulse INTEGER,
    danger_signs TEXT,
    notes TEXT,
    red_flags TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS protocol_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_id TEXT,
    doc_title TEXT,
    section TEXT,
    chunk_index INTEGER,
    content TEXT,
    tokens TEXT,
    tfidf_vector TEXT,
    tags TEXT
  );

  CREATE TABLE IF NOT EXISTS guidance (
    id TEXT PRIMARY KEY,
    encounter_id TEXT,
    guidance_text TEXT,
    citations TEXT,
    safety_note TEXT,
    escalation_needed INTEGER DEFAULT 0,
    model TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY,
    encounter_id TEXT,
    summary TEXT,
    urgency TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS stock_items (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    quantity INTEGER DEFAULT 0,
    unit TEXT,
    reorder_level INTEGER DEFAULT 10,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_chunks_doc ON protocol_chunks(doc_id);
`;

function initDB() {
  if (db) return db;
  
  db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  
  console.log('[DB] SQLite initialized (in-memory)');
  return db;
}

function getDB() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

module.exports = { initDB, getDB };
```

**✓ Checkpoint:** Database module created.

---

## Step 2: Create Health Route

Create file `api/src/routes/health.js`:

### Copilot Prompt

```
@workspace Create an Express router for /api/health that returns:
- status: ok
- timestamp
- services object showing database and AI status
```

### Expected Code

```javascript
const express = require('express');
const { getDB } = require('../db/index');

const router = express.Router();

router.get('/', (req, res) => {
  let dbStatus = 'unknown';
  let protocolCount = 0;
  
  try {
    const db = getDB();
    const row = db.prepare('SELECT COUNT(*) as count FROM protocol_chunks').get();
    protocolCount = row.count;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }
  
  res.json({
    status: 'ok',
    message: 'AfyaPack API is running',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      protocolCount,
    },
  });
});

module.exports = router;
```

---

## Step 3: Create Protocols Route

Create file `api/src/routes/protocols.js`:

### Copilot Prompt

```
@workspace Create an Express router for protocols with:
- GET / - List unique protocol documents (doc_id, doc_title, section count)
- POST /search - Search protocol chunks (accepts query and topK in body)
- Use the retrieval service for searching (to be implemented)
```

### Expected Code

```javascript
const express = require('express');
const { getDB } = require('../db/index');
const { searchProtocols } = require('../services/retrieval');

const router = express.Router();

// List all protocol documents
router.get('/', (req, res) => {
  try {
    const db = getDB();
    const docs = db.prepare(`
      SELECT doc_id, doc_title, COUNT(*) as section_count
      FROM protocol_chunks
      GROUP BY doc_id, doc_title
    `).all();
    
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search protocol chunks
router.post('/search', (req, res) => {
  try {
    const { query, topK = 4 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }
    
    const results = searchProtocols(query, topK);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

---

## Step 4: Create Encounters Route

Create file `api/src/routes/encounters.js`:

### Copilot Prompt

```
@workspace Create an Express router for patient encounters with:
- GET / - List all encounters (most recent first)
- POST / - Create encounter with red flag screening
- GET /:id - Get single encounter by ID
- Include UUID generation for IDs
- Include red flag screening (call a screenRedFlags function)
```

### Expected Code

```javascript
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/index');
const { screenRedFlags } = require('../services/redflags');

const router = express.Router();

// List all encounters
router.get('/', (req, res) => {
  try {
    const db = getDB();
    const rows = db.prepare(
      'SELECT * FROM encounters ORDER BY created_at DESC LIMIT 50'
    ).all();
    
    const encounters = rows.map(row => ({
      ...row,
      symptoms: JSON.parse(row.symptoms || '[]'),
      danger_signs: JSON.parse(row.danger_signs || '[]'),
      red_flags: JSON.parse(row.red_flags || '[]'),
    }));
    
    res.json(encounters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new encounter
router.post('/', (req, res) => {
  try {
    const {
      age, sex, pregnant = false, symptoms = [],
      duration, temperature, pulse, danger_signs = [], notes
    } = req.body;
    
    // Screen for red flags
    const redFlags = screenRedFlags({
      age, temperature, pulse, symptoms, danger_signs, pregnant
    });
    
    const id = uuidv4();
    const db = getDB();
    
    db.prepare(`
      INSERT INTO encounters (id, age, sex, pregnant, symptoms, duration, temperature, pulse, danger_signs, notes, red_flags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      age,
      sex,
      pregnant ? 1 : 0,
      JSON.stringify(symptoms),
      duration,
      temperature,
      pulse,
      JSON.stringify(danger_signs),
      notes,
      JSON.stringify(redFlags)
    );
    
    res.status(201).json({
      id,
      age, sex, pregnant, symptoms, duration, temperature, pulse, danger_signs, notes,
      red_flags: redFlags,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single encounter
router.get('/:id', (req, res) => {
  try {
    const db = getDB();
    const row = db.prepare('SELECT * FROM encounters WHERE id = ?').get(req.params.id);
    
    if (!row) {
      return res.status(404).json({ error: 'Encounter not found' });
    }
    
    res.json({
      ...row,
      symptoms: JSON.parse(row.symptoms || '[]'),
      danger_signs: JSON.parse(row.danger_signs || '[]'),
      red_flags: JSON.parse(row.red_flags || '[]'),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

---

## Step 5: Create Red Flags Service

Create file `api/src/services/redflags.js`:

### Copilot Prompt

```
@workspace Create a red flag screening function that checks:
- Temperature >= 40°C → critical (urgent referral)
- Temperature >= 39°C → high
- Temperature < 35.5°C → critical (hypothermia)
- Pulse > 130 → critical
- Pulse > 110 → high  
- Pulse < 50 → critical
- Danger sign keywords: convulsions, unconscious, unable to drink, severe bleeding, stiff neck
- Pregnancy + headache + swelling → pre-eclampsia warning
- Return array of { severity, message, rule }
```

### Expected Code

```javascript
function screenRedFlags(encounter) {
  const flags = [];
  const { temperature, pulse, symptoms = [], danger_signs = [], pregnant, age } = encounter;

  const temp = parseFloat(temperature);
  const p = parseInt(pulse);
  const allText = [...symptoms, ...danger_signs].join(' ').toLowerCase();

  // Temperature checks
  if (!isNaN(temp) && temp > 0) {
    if (temp >= 40.0) {
      flags.push({ severity: 'critical', message: `Dangerously high fever (${temp}°C) — URGENT REFERRAL`, rule: 'temp_critical' });
    } else if (temp >= 39.0) {
      flags.push({ severity: 'high', message: `High fever (${temp}°C) — assess for malaria`, rule: 'temp_high' });
    } else if (temp >= 38.5) {
      flags.push({ severity: 'medium', message: `Elevated temperature (${temp}°C) — give antipyretic`, rule: 'temp_medium' });
    } else if (temp < 35.5) {
      flags.push({ severity: 'critical', message: `Hypothermia (${temp}°C) — URGENT REFERRAL`, rule: 'temp_low' });
    }
  }

  // Pulse checks
  if (!isNaN(p) && p > 0) {
    if (p > 130) {
      flags.push({ severity: 'critical', message: `Severe tachycardia (${p} bpm) — URGENT REFERRAL`, rule: 'pulse_critical' });
    } else if (p > 110) {
      flags.push({ severity: 'high', message: `Tachycardia (${p} bpm) — clinical review`, rule: 'pulse_high' });
    } else if (p < 50) {
      flags.push({ severity: 'critical', message: `Bradycardia (${p} bpm) — URGENT REFERRAL`, rule: 'pulse_low' });
    }
  }

  // Danger sign keywords
  const criticals = [
    { kws: ['convulsion', 'seizure', 'fitting'], msg: 'Convulsions reported — URGENT REFERRAL', rule: 'convulsion' },
    { kws: ['unconscious', 'unresponsive'], msg: 'Altered consciousness — URGENT REFERRAL', rule: 'consciousness' },
    { kws: ['unable to drink', 'not drinking', 'cannot feed'], msg: 'Unable to feed/drink — assess urgently', rule: 'hydration' },
    { kws: ['severe bleeding', 'haemorrhage'], msg: 'Severe bleeding — URGENT REFERRAL', rule: 'bleeding' },
    { kws: ['stiff neck'], msg: 'Stiff neck — possible meningitis, URGENT REFERRAL', rule: 'meningitis' },
  ];

  criticals.forEach(({ kws, msg, rule }) => {
    if (kws.some(kw => allText.includes(kw))) {
      flags.push({ severity: 'critical', message: msg, rule });
    }
  });

  // Pregnancy danger signs
  if (pregnant) {
    if (allText.includes('headache') && (allText.includes('swelling') || allText.includes('oedema'))) {
      flags.push({ severity: 'critical', message: 'URGENT — Possible pre-eclampsia. Refer immediately', rule: 'preeclampsia' });
    }
  }

  // Remove duplicates by rule
  const seen = new Set();
  return flags.filter(f => {
    if (seen.has(f.rule)) return false;
    seen.add(f.rule);
    return true;
  });
}

module.exports = { screenRedFlags };
```

---

## Step 6: Wire Up Routes in index.js

Update `api/src/index.js`:

### Copilot Prompt

```
@workspace Update the Express index.js to:
- Import all route modules
- Initialize the database on startup
- Mount routes at their paths
- Add request logging
- Add 404 and error handlers
```

### Updated Code

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDB } = require('./db/index');

const healthRouter = require('./routes/health');
const protocolsRouter = require('./routes/protocols');
const encountersRouter = require('./routes/encounters');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/health', healthRouter);
app.use('/api/protocols', protocolsRouter);
app.use('/api/encounters', encountersRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[Error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Startup
async function start() {
  try {
    console.log('[AfyaPack] Starting API server...');
    await initDB();
    
    app.listen(PORT, () => {
      console.log(`[AfyaPack] API running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[AfyaPack] Startup failed:', err);
    process.exit(1);
  }
}

start();
```

---

## Step 7: Create Stub for Retrieval Service

Create `api/src/services/retrieval.js` (stub for now):

```javascript
// Stub - will be implemented in Lesson 07

function searchProtocols(query, topK = 4) {
  console.log(`[Retrieval] Searching for: "${query}" (topK: ${topK})`);
  return []; // Empty until we implement TF-IDF
}

module.exports = { searchProtocols };
```

---

## Step 8: Test the API

### Start the Server

```powershell
cd api
npm run dev
```

### Test Endpoints

```powershell
# Health check
curl http://localhost:3001/api/health

# Create an encounter
curl -X POST http://localhost:3001/api/encounters `
  -H "Content-Type: application/json" `
  -d '{
    "age": 2,
    "sex": "male",
    "symptoms": ["fever", "diarrhea"],
    "temperature": 39.5,
    "pulse": 120
  }'

# List encounters
curl http://localhost:3001/api/encounters

# List protocols (empty for now)
curl http://localhost:3001/api/protocols
```

**✓ Checkpoint:** All endpoints respond correctly.

---

## Validation Checklist

Before proceeding to Lesson 05:

- [ ] Database initializes without errors
- [ ] `/api/health` returns status JSON
- [ ] `POST /api/encounters` creates an encounter
- [ ] Created encounter shows red flags for high temperature
- [ ] `GET /api/encounters` lists saved encounters
- [ ] Server logs requests

---

## Troubleshooting

### "Cannot find module './db/index'"
Check your file paths. Make sure `api/src/db/index.js` exists.

### "better-sqlite3 error"
```powershell
cd api
npm rebuild better-sqlite3
```

### "screenRedFlags is not a function"
Make sure `api/src/services/redflags.js` exists and exports the function.

---

## What You Learned

- How to structure Express routes
- How to use SQLite with better-sqlite3
- How to design API endpoints
- How to implement rule-based screening logic
- How to wire routes into the main app

---

## Next Step

**Proceed to Lesson 05:** Foundry Integration

You'll connect the API to Foundry Local for AI-powered responses.

---

*API is ready. Time to add intelligence. →*
