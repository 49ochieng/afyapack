const { getDB } = require('../db/index');

// Common English stop words to exclude from TF-IDF
const STOP_WORDS = new Set([
  'a','an','and','are','as','at','be','been','being','by','do','does',
  'done','for','from','had','has','have','he','her','his','how','i',
  'if','in','is','it','its','just','me','more','my','not','of','on',
  'or','our','out','so','than','that','the','their','them','then',
  'there','they','this','to','up','us','was','we','were','what','when',
  'which','who','will','with','would','you','your','also','but','can',
  'get','may','no','should','such','use','well','been','into',
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

function computeTF(tokens) {
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const total = Math.max(tokens.length, 1);
  Object.keys(tf).forEach(t => { tf[t] = tf[t] / total; });
  return tf;
}

function computeIDF(allTokenArrays) {
  const docCount = allTokenArrays.length;
  const df = {};
  allTokenArrays.forEach(tokens => {
    new Set(tokens).forEach(t => { df[t] = (df[t] || 0) + 1; });
  });
  const idf = {};
  Object.keys(df).forEach(t => {
    idf[t] = Math.log((docCount + 1) / (df[t] + 1)) + 1;
  });
  return idf;
}

function buildTFIDFVector(tokens, idf) {
  const tf = computeTF(tokens);
  const vec = {};
  Object.keys(tf).forEach(t => {
    vec[t] = tf[t] * (idf[t] || Math.log(2));
  });
  return vec;
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0, magA = 0, magB = 0;
  const keysA = Object.keys(vecA);
  keysA.forEach(k => {
    dot += vecA[k] * (vecB[k] || 0);
    magA += vecA[k] ** 2;
  });
  Object.values(vecB).forEach(v => { magB += v ** 2; });
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Build the IDF lookup from all stored chunks.
 * Called once at startup and cached.
 */
let cachedIDF = null;

function buildIDF() {
  const db = getDB();
  const rows = db.prepare('SELECT tokens FROM protocol_chunks').all();
  const allTokenArrays = rows.map(r => JSON.parse(r.tokens));
  cachedIDF = computeIDF(allTokenArrays);
  return cachedIDF;
}

function getIDF() {
  if (!cachedIDF) return buildIDF();
  return cachedIDF;
}

/**
 * Search protocol chunks by query string.
 * Returns top K most relevant chunks.
 */
function searchProtocols(query, topK = 4) {
  const db = getDB();
  const chunks = db.prepare('SELECT * FROM protocol_chunks ORDER BY doc_id, chunk_index').all();
  if (chunks.length === 0) return [];

  const idf = getIDF();
  const queryTokens = tokenize(query);
  const queryVec = buildTFIDFVector(queryTokens, idf);

  const scored = chunks.map(chunk => {
    const chunkVec = JSON.parse(chunk.tfidf_vector);
    const score = cosineSimilarity(queryVec, chunkVec);
    return { ...chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored
    .filter(c => c.score > 0.01)
    .slice(0, topK)
    .map(c => ({
      id: c.id,
      doc_id: c.doc_id,
      doc_title: c.doc_title,
      section: c.section,
      content: c.content,
      score: Math.round(c.score * 100) / 100,
      tags: JSON.parse(c.tags || '[]'),
    }));
}

/**
 * Ingest protocol documents into SQLite with TF-IDF vectors.
 * @param {Array} documents - [{ id, title, sections: [{ heading, text }] }]
 */
function ingestProtocols(documents) {
  const db = getDB();

  // Clear existing chunks
  db.prepare('DELETE FROM protocol_chunks').run();

  // Collect all chunks first so we can build IDF
  const allChunks = [];
  documents.forEach(doc => {
    doc.sections.forEach((section, idx) => {
      const tokens = tokenize(section.text);
      allChunks.push({
        doc_id: doc.id,
        doc_title: doc.title,
        section: section.heading || '',
        chunk_index: idx,
        content: section.text,
        tokens,
        tags: doc.tags || [],
      });
    });
  });

  // Build IDF across all chunks
  const allTokenArrays = allChunks.map(c => c.tokens);
  const idf = computeIDF(allTokenArrays);
  cachedIDF = idf; // Cache for later use

  // Insert with TF-IDF vectors
  const insert = db.prepare(`
    INSERT INTO protocol_chunks
      (doc_id, doc_title, section, chunk_index, content, tokens, tfidf_vector, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction(chunks => {
    chunks.forEach(chunk => {
      const vec = buildTFIDFVector(chunk.tokens, idf);
      insert.run(
        chunk.doc_id,
        chunk.doc_title,
        chunk.section,
        chunk.chunk_index,
        chunk.content,
        JSON.stringify(chunk.tokens),
        JSON.stringify(vec),
        JSON.stringify(chunk.tags),
      );
    });
  });

  insertMany(allChunks);
  console.log(`[Retrieval] Ingested ${allChunks.length} protocol chunks`);
}

module.exports = { searchProtocols, ingestProtocols, tokenize, buildIDF };
