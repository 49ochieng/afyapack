/**
 * SQLite database layer using sql.js (pure-JS WASM — no native compilation required).
 * Provides a better-sqlite3-compatible synchronous API.
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../afyapack.db');

let _sqlJsDB = null;
let _compatDB = null;

// ─── Save to disk ────────────────────────────────────────────────────────────

let _saveTimer = null;

function scheduleSave() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    try {
      const data = _sqlJsDB.export();
      fs.writeFileSync(DB_PATH, Buffer.from(data));
    } catch (err) {
      console.error('[DB] Save error:', err.message);
    }
  }, 300);
}

function forceSave() {
  if (!_sqlJsDB) return;
  const data = _sqlJsDB.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ─── better-sqlite3 compatible API ──────────────────────────────────────────

function createCompatDB(sqlJsDB) {
  function normalizeParams(params) {
    // Flatten spread args or single array arg
    if (params.length === 0) return [];
    if (params.length === 1 && Array.isArray(params[0])) return params[0];
    return params;
  }

  function prepare(sql) {
    return {
      run(...args) {
        const params = normalizeParams(args);
        sqlJsDB.run(sql, params);
        scheduleSave();
        const rowIdRes = sqlJsDB.exec('SELECT last_insert_rowid()');
        const lastInsertRowid = rowIdRes[0]?.values[0]?.[0] ?? null;
        const changes = sqlJsDB.getRowsModified ? sqlJsDB.getRowsModified() : 1;
        return { lastInsertRowid, changes };
      },

      get(...args) {
        const params = normalizeParams(args);
        const stmt = sqlJsDB.prepare(sql);
        try {
          stmt.bind(params);
          if (!stmt.step()) return undefined;
          return stmt.getAsObject();
        } finally {
          stmt.free();
        }
      },

      all(...args) {
        const params = normalizeParams(args);
        const stmt = sqlJsDB.prepare(sql);
        try {
          stmt.bind(params);
          const rows = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          return rows;
        } finally {
          stmt.free();
        }
      },
    };
  }

  function exec(sql) {
    // Split on semicolons and run each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    for (const stmt of statements) {
      try {
        sqlJsDB.run(stmt);
      } catch (err) {
        // Skip "already exists" errors gracefully
        if (!err.message?.includes('already exists')) throw err;
      }
    }
  }

  function transaction(fn) {
    return function (arg) {
      sqlJsDB.run('BEGIN');
      try {
        fn(arg);
        sqlJsDB.run('COMMIT');
        scheduleSave();
      } catch (err) {
        sqlJsDB.run('ROLLBACK');
        throw err;
      }
    };
  }

  return { prepare, exec, transaction };
}

// ─── Initialization ───────────────────────────────────────────────────────────

async function initDB() {
  if (_compatDB) return _compatDB;

  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    _sqlJsDB = new SQL.Database(buf);
    console.log('[DB] Loaded from', DB_PATH);
  } else {
    _sqlJsDB = new SQL.Database();
    console.log('[DB] New database created');
  }

  _compatDB = createCompatDB(_sqlJsDB);

  // Create tables
  _compatDB.exec(`
    CREATE TABLE IF NOT EXISTS protocol_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id TEXT NOT NULL,
      doc_title TEXT NOT NULL,
      section TEXT DEFAULT '',
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      tokens TEXT NOT NULL,
      tfidf_vector TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS encounters (
      id TEXT PRIMARY KEY,
      age INTEGER,
      sex TEXT,
      pregnant INTEGER DEFAULT 0,
      symptoms TEXT NOT NULL DEFAULT '[]',
      duration TEXT,
      temperature REAL,
      pulse INTEGER,
      danger_signs TEXT DEFAULT '[]',
      notes TEXT DEFAULT '',
      red_flags TEXT DEFAULT '[]',
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS guidance (
      id TEXT PRIMARY KEY,
      encounter_id TEXT NOT NULL,
      guidance_text TEXT NOT NULL,
      citations TEXT DEFAULT '[]',
      safety_note TEXT DEFAULT '',
      escalation_needed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY,
      encounter_id TEXT NOT NULL,
      summary TEXT NOT NULL,
      facility TEXT DEFAULT '',
      urgency TEXT DEFAULT 'routine',
      saved INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'medicine',
      quantity INTEGER DEFAULT 0,
      unit TEXT DEFAULT 'units',
      low_threshold INTEGER DEFAULT 10,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  forceSave();
  console.log('[DB] Tables initialized');

  // Graceful shutdown save
  process.on('SIGINT', () => { forceSave(); process.exit(0); });
  process.on('SIGTERM', () => { forceSave(); process.exit(0); });

  return _compatDB;
}

function getDB() {
  if (!_compatDB) throw new Error('[DB] Database not initialized. Call await initDB() first.');
  return _compatDB;
}

module.exports = { getDB, initDB, forceSave };
