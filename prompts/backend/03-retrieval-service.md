# Prompt: TF-IDF Retrieval Service

## Description
Create a text retrieval service using TF-IDF (Term Frequency-Inverse Document Frequency) for semantic search without requiring vector databases or external services.

---

## The Prompt

```
Create a JavaScript service for TF-IDF text retrieval that:
1. Tokenizes text into words (handling medical terms)
2. Calculates term frequency (TF) per document
3. Calculates inverse document frequency (IDF) across corpus
4. Computes TF-IDF vectors for documents
5. Finds similar documents using cosine similarity
6. Returns top K most relevant chunks for a query
7. Works entirely in memory (no external dependencies)
8. Handles both English and Swahili text

Include functions for:
- indexDocuments(documents) - build the index
- search(query, topK) - find similar documents
- addDocument(doc) - add to existing index
```

---

## Expected Output

### api/src/services/retrieval.js
```javascript
/**
 * TF-IDF Retrieval Service
 * Lightweight semantic search without vector databases
 */

// Stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'must', 'shall',
  'can', 'of', 'to', 'in', 'for', 'on', 'with', 'at', 'by',
  'from', 'as', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'under', 'again', 'further',
  'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or',
  'because', 'until', 'while', 'this', 'that', 'these', 'those',
  // Swahili stop words
  'na', 'ya', 'wa', 'kwa', 'ni', 'au', 'la', 'za', 'katika'
]);

// State
let documents = [];
let vocabulary = new Map();  // word -> index
let idfValues = new Map();   // word -> IDF
let documentVectors = [];    // TF-IDF vectors

/**
 * Tokenize text into words
 */
function tokenize(text) {
  if (!text) return [];
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Remove punctuation
    .split(/\s+/)              // Split on whitespace
    .filter(word => 
      word.length > 2 && 
      !STOP_WORDS.has(word) &&
      !/^\d+$/.test(word)      // Skip pure numbers
    );
}

/**
 * Calculate term frequency for a token list
 */
function calculateTF(tokens) {
  const tf = new Map();
  const totalTokens = tokens.length;
  
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  
  // Normalize by document length
  for (const [word, count] of tf) {
    tf.set(word, count / totalTokens);
  }
  
  return tf;
}

/**
 * Calculate IDF across all documents
 */
function calculateIDF(tokenizedDocs) {
  const docCount = tokenizedDocs.length;
  const wordDocCounts = new Map();
  
  // Count documents containing each word
  for (const tokens of tokenizedDocs) {
    const uniqueTokens = new Set(tokens);
    for (const token of uniqueTokens) {
      wordDocCounts.set(token, (wordDocCounts.get(token) || 0) + 1);
    }
  }
  
  // Calculate IDF: log(N / df)
  const idf = new Map();
  for (const [word, docFreq] of wordDocCounts) {
    idf.set(word, Math.log(docCount / docFreq));
  }
  
  return idf;
}

/**
 * Build vocabulary from all tokens
 */
function buildVocabulary(tokenizedDocs) {
  const vocab = new Map();
  let index = 0;
  
  for (const tokens of tokenizedDocs) {
    for (const token of tokens) {
      if (!vocab.has(token)) {
        vocab.set(token, index++);
      }
    }
  }
  
  return vocab;
}

/**
 * Convert TF map to TF-IDF vector
 */
function toTFIDFVector(tfMap, vocab, idf) {
  const vector = new Array(vocab.size).fill(0);
  
  for (const [word, tf] of tfMap) {
    const idx = vocab.get(word);
    if (idx !== undefined) {
      const idfValue = idf.get(word) || 0;
      vector[idx] = tf * idfValue;
    }
  }
  
  return vector;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (normA * normB);
}

/**
 * Index a collection of documents
 * @param {Array} docs - Array of { id, content, title?, metadata? }
 */
export function indexDocuments(docs) {
  documents = docs;
  
  // Tokenize all documents
  const tokenizedDocs = docs.map(doc => 
    tokenize(`${doc.title || ''} ${doc.content}`)
  );
  
  // Build vocabulary and IDF
  vocabulary = buildVocabulary(tokenizedDocs);
  idfValues = calculateIDF(tokenizedDocs);
  
  // Calculate TF-IDF vectors for all documents
  documentVectors = tokenizedDocs.map(tokens => {
    const tf = calculateTF(tokens);
    return toTFIDFVector(tf, vocabulary, idfValues);
  });
  
  console.log(`Indexed ${docs.length} documents, vocabulary size: ${vocabulary.size}`);
}

/**
 * Search for documents similar to query
 * @param {string} query - Search query
 * @param {number} topK - Number of results to return
 * @returns {Array} - Top matching documents with scores
 */
export function search(query, topK = 5) {
  if (documents.length === 0) {
    return [];
  }
  
  // Tokenize and vectorize query
  const queryTokens = tokenize(query);
  const queryTF = calculateTF(queryTokens);
  const queryVector = toTFIDFVector(queryTF, vocabulary, idfValues);
  
  // Calculate similarity with all documents
  const scores = documentVectors.map((docVector, index) => ({
    document: documents[index],
    score: cosineSimilarity(queryVector, docVector)
  }));
  
  // Sort by score and return top K
  return scores
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => ({
      ...s.document,
      relevanceScore: Math.round(s.score * 100) / 100
    }));
}

/**
 * Add a single document to existing index
 * (Rebuilds index - use batch indexDocuments for many additions)
 */
export function addDocument(doc) {
  documents.push(doc);
  indexDocuments(documents);
}

/**
 * Get index statistics
 */
export function getStats() {
  return {
    documentCount: documents.length,
    vocabularySize: vocabulary.size,
    indexed: documents.length > 0
  };
}
```

---

## Usage Example

```javascript
import { indexDocuments, search } from './services/retrieval.js';

// Index protocol documents
const protocols = [
  { id: 'p1', title: 'Malaria Treatment', content: 'For uncomplicated malaria in children...' },
  { id: 'p2', title: 'Diarrhea Management', content: 'ORS and zinc supplementation...' },
  { id: 'p3', title: 'Pneumonia Signs', content: 'Fast breathing and chest indrawing...' }
];

indexDocuments(protocols);

// Search
const results = search('child with fever and fast breathing', 3);
// Returns: [{ id: 'p1', title: '...', relevanceScore: 0.72 }, ...]
```

---

## Key Concepts

### TF-IDF Formula
```
TF-IDF(word, doc) = TF(word, doc) × IDF(word)

TF = (count of word in doc) / (total words in doc)
IDF = log(total docs / docs containing word)
```

### Cosine Similarity
```
similarity = (A · B) / (||A|| × ||B||)
```
Range: 0 (no similarity) to 1 (identical)

---

## Advantages Over Vector DBs

| TF-IDF | Vector Database |
|--------|-----------------|
| No external service | Requires separate service |
| Works offline | Often needs network |
| Fast for small corpus | Better for millions |
| Predictable results | Black-box embeddings |
| Zero cost | Usage-based pricing |

---

## Variations

### With Stemming
```
Add Porter Stemmer to normalize words (running → run, children → child). Improves recall for morphological variants.
```

### With BM25
```
Replace TF-IDF with BM25 scoring for better relevance ranking. BM25 handles document length normalization better.
```
