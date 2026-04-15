# Prompt: SQLite Database Module

## Description
Create a database module using better-sqlite3 for efficient embedded database operations.

---

## The Prompt

```
Create a SQLite database module using better-sqlite3 that:
1. Initializes database file from environment variable or default path
2. Creates tables on first run (encounters, protocols, stock)
3. Provides helper methods for common operations
4. Uses prepared statements for performance
5. Has proper error handling
6. Supports migrations for schema changes
7. Exports both the db instance and helper functions

Design for a health app with patient encounters, protocol documents, and inventory.
```

---

## Expected Output

### api/src/db/index.js
```javascript
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_PATH || join(__dirname, '../../data/afyapack.db');

// Ensure data directory exists
const dataDir = dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS encounters (
    id TEXT PRIMARY KEY,
    patient_age INTEGER,
    patient_age_unit TEXT DEFAULT 'years',
    patient_sex TEXT,
    symptoms TEXT,
    vitals TEXT,
    guidance TEXT,
    red_flags TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS protocol_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    protocol_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    section TEXT,
    tokens TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stock_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'units',
    min_quantity INTEGER DEFAULT 10,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_encounters_created 
    ON encounters(created_at);
  CREATE INDEX IF NOT EXISTS idx_protocol_chunks_protocol 
    ON protocol_chunks(protocol_id);
  CREATE INDEX IF NOT EXISTS idx_stock_category 
    ON stock_items(category);
`);

// Prepared statements for common operations
const statements = {
  // Encounters
  insertEncounter: db.prepare(`
    INSERT INTO encounters (id, patient_age, patient_age_unit, patient_sex, symptoms, vitals, guidance, red_flags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getEncounter: db.prepare('SELECT * FROM encounters WHERE id = ?'),
  listEncounters: db.prepare('SELECT * FROM encounters ORDER BY created_at DESC LIMIT ?'),
  
  // Protocols
  insertChunk: db.prepare(`
    INSERT INTO protocol_chunks (protocol_id, title, content, section, tokens)
    VALUES (?, ?, ?, ?, ?)
  `),
  searchChunks: db.prepare(`
    SELECT * FROM protocol_chunks 
    WHERE content LIKE ? OR title LIKE ?
    LIMIT ?
  `),
  getAllChunks: db.prepare('SELECT * FROM protocol_chunks'),
  
  // Stock
  insertStock: db.prepare(`
    INSERT OR REPLACE INTO stock_items (id, name, category, quantity, unit, min_quantity, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `),
  getStock: db.prepare('SELECT * FROM stock_items WHERE id = ?'),
  listStock: db.prepare('SELECT * FROM stock_items ORDER BY name'),
  updateQuantity: db.prepare(`
    UPDATE stock_items SET quantity = ?, updated_at = datetime('now') WHERE id = ?
  `),
  getLowStock: db.prepare('SELECT * FROM stock_items WHERE quantity < min_quantity'),
};

// Helper functions
export function createEncounter(data) {
  return statements.insertEncounter.run(
    data.id,
    data.patientAge,
    data.patientAgeUnit || 'years',
    data.patientSex,
    JSON.stringify(data.symptoms),
    JSON.stringify(data.vitals),
    data.guidance,
    JSON.stringify(data.redFlags || [])
  );
}

export function getEncounter(id) {
  const row = statements.getEncounter.get(id);
  if (!row) return null;
  return {
    ...row,
    symptoms: JSON.parse(row.symptoms || '[]'),
    vitals: JSON.parse(row.vitals || '{}'),
    red_flags: JSON.parse(row.red_flags || '[]')
  };
}

export function listEncounters(limit = 50) {
  return statements.listEncounters.all(limit).map(row => ({
    ...row,
    symptoms: JSON.parse(row.symptoms || '[]'),
    vitals: JSON.parse(row.vitals || '{}'),
    red_flags: JSON.parse(row.red_flags || '[]')
  }));
}

export function getAllProtocolChunks() {
  return statements.getAllChunks.all();
}

export function insertProtocolChunk(chunk) {
  return statements.insertChunk.run(
    chunk.protocolId,
    chunk.title,
    chunk.content,
    chunk.section || null,
    JSON.stringify(chunk.tokens || [])
  );
}

export function searchProtocols(query, limit = 10) {
  const pattern = `%${query}%`;
  return statements.searchChunks.all(pattern, pattern, limit);
}

export function upsertStockItem(item) {
  return statements.insertStock.run(
    item.id,
    item.name,
    item.category || 'general',
    item.quantity || 0,
    item.unit || 'units',
    item.minQuantity || 10
  );
}

export function getStockItem(id) {
  return statements.getStock.get(id);
}

export function listStockItems() {
  return statements.listStock.all();
}

export function updateStockQuantity(id, quantity) {
  return statements.updateQuantity.run(quantity, id);
}

export function getLowStockItems() {
  return statements.getLowStock.all();
}

// Export raw db for advanced queries
export { db };
```

---

## Key Patterns

### 1. Prepared Statements
Better performance for repeated queries:
```javascript
const stmt = db.prepare('SELECT * FROM items WHERE id = ?');
const item = stmt.get(id);  // Reuses compiled statement
```

### 2. JSON Storage
Store complex objects as JSON strings:
```javascript
// Write
db.prepare('INSERT INTO t (data) VALUES (?)').run(JSON.stringify(obj));
// Read
const row = db.prepare('SELECT data FROM t').get();
const obj = JSON.parse(row.data);
```

### 3. Transactions
For multiple operations:
```javascript
const insertMany = db.transaction((items) => {
  for (const item of items) {
    insertStmt.run(item);
  }
});
insertMany(myItems);  // All-or-nothing
```

---

## Variations

### With Migrations
```
Create a SQLite database module with a migrations system. Store migration history in a _migrations table and auto-run pending migrations on startup.
```

### With Full-Text Search
```
Create a SQLite database module that uses FTS5 for full-text search on protocol content. Include helper functions for search with ranking.
```
