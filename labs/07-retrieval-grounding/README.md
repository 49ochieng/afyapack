# Lesson 07: Retrieval & Grounding

> Implement TF-IDF search to ground AI responses in clinical protocols.

---

## Lesson Overview

| | |
|---|---|
| **Duration** | 50 minutes |
| **Objective** | Build a retrieval system that grounds AI in real protocols |
| **Output** | Working semantic search with citations |
| **Prerequisites** | Lesson 06 (Chat experience complete) |
| **Files/Folders** | `api/src/services/retrieval.js`, `api/src/db/seed.js` |

---

## Why Grounding Matters

```
Without Grounding:          With Grounding (RAG):
┌─────────────────┐        ┌─────────────────┐
│ "What's the     │        │ "What's the     │
│ treatment for   │        │ treatment for   │
│ malaria?"       │        │ malaria?"       │
└────────┬────────┘        └────────┬────────┘
         │                          │
         ▼                          ▼
  ┌──────────────┐         ┌──────────────────┐
  │ LLM makes up │         │ Search protocols │
  │ an answer... │         │ for "malaria"    │
  └──────────────┘         └────────┬─────────┘
         │                          │
         ▼                          ▼
  "Give ACT 3x    "     ┌────────────────────┐
   daily..."            │ Found: Malaria     │
   ❌ Wrong dose        │ Protocol Sec 4.2   │
                        │ "ACT: 1 tablet     │
                        │ twice daily for    │
                        │ 3 days based on    │
                        │ weight..."         │
                        └────────┬───────────┘
                                 │
                                 ▼
                          "Per Malaria Protocol
                           Section 4.2: ACT
                           twice daily..."
                           ✅ Correct, cited
```

**RAG = Retrieval-Augmented Generation**

---

## Step 1: Create Protocol Documents

Create file `api/src/db/protocols/malaria.json`:

### Copilot Prompt

```
@workspace Create a malaria protocol JSON document with:
- doc_id: "malaria"
- doc_title: "Malaria Management Protocol"  
- Array of sections with title and content
- Include: assessment, danger signs, treatment by age/weight, when to refer
- Content should be realistic CHW-level guidance
```

### Expected Structure

```json
{
  "doc_id": "malaria",
  "doc_title": "Malaria Management Protocol",
  "sections": [
    {
      "title": "Assessment",
      "content": "Suspect malaria in any patient with fever (≥37.5°C) or history of fever in the past 48 hours, especially during rainy season. Key symptoms include: fever, chills, headache, body aches, fatigue. Children under 5 and pregnant women are at highest risk. Always perform an RDT (Rapid Diagnostic Test) if available."
    },
    {
      "title": "Danger Signs",
      "content": "REFER IMMEDIATELY if any danger sign present: Unable to drink or breastfeed, Vomiting everything, Convulsions (now or recently), Unconscious or very sleepy, Severe pallor (severe anemia), Very weak or unable to sit/stand. These signs indicate severe malaria requiring hospital care."
    },
    {
      "title": "Treatment - Under 5 years",
      "content": "For confirmed uncomplicated malaria in children under 5: Give ACT (Artemether-Lumefantrine) according to weight. 5-14kg: 1 tablet twice daily for 3 days. 15-24kg: 2 tablets twice daily for 3 days. Give with food or milk. First dose should be observed. Give paracetamol for fever (10-15mg/kg every 6 hours if needed)."
    },
    {
      "title": "Treatment - Over 5 years and Adults",
      "content": "For confirmed uncomplicated malaria in older children and adults: ACT (Artemether-Lumefantrine): 25-34kg: 3 tablets twice daily for 3 days. 35kg+: 4 tablets twice daily for 3 days. Ensure full 3-day course is completed even if feeling better. Advise increased fluid intake and rest."
    },
    {
      "title": "When to Refer",
      "content": "Refer to health facility if: Any danger sign present, RDT positive in pregnancy, No improvement after 48 hours of ACT, Child under 2 months, Unable to take oral medication, Suspected severe anemia (very pale palms/conjunctiva). Document vital signs and treatments given before referral."
    },
    {
      "title": "Prevention Counseling",
      "content": "Advise on malaria prevention: Sleep under insecticide-treated bed net (ITN) every night. Pregnant women should attend ANC and take IPTp. Seek care early for any fever. Complete full treatment course. Keep surroundings clean - remove stagnant water where mosquitoes breed."
    }
  ]
}
```

Create similar files for other protocols:
- `api/src/db/protocols/diarrhea.json`
- `api/src/db/protocols/pneumonia.json`
- `api/src/db/protocols/pregnancy.json`
- `api/src/db/protocols/nutrition.json`

---

## Step 2: Build the Seeding Script

Create file `api/src/db/seed.js`:

### Copilot Prompt

```
@workspace Create a database seeding script that:
- Reads all JSON files from protocols folder
- Splits each section into chunks (for retrieval)
- Tokenizes text (lowercase, remove stopwords)
- Computes TF-IDF vectors
- Inserts chunks into protocol_chunks table
- Shows progress during seeding
```

### Expected Code

```javascript
const fs = require('fs');
const path = require('path');
const { initDB, getDB } = require('./index');

// Stop words to filter out
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
  'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
  'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or',
  'because', 'until', 'while', 'this', 'that', 'these', 'those', 'it', 'its'
]);

// Tokenize text into words
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

// Compute term frequency
function computeTF(tokens) {
  const tf = {};
  tokens.forEach(token => {
    tf[token] = (tf[token] || 0) + 1;
  });
  // Normalize
  const maxFreq = Math.max(...Object.values(tf));
  Object.keys(tf).forEach(token => {
    tf[token] = tf[token] / maxFreq;
  });
  return tf;
}

// Load and seed protocols
async function seedProtocols() {
  console.log('[Seed] Starting database seeding...');
  
  const db = initDB();
  
  // Clear existing data
  db.prepare('DELETE FROM protocol_chunks').run();
  
  const protocolsDir = path.join(__dirname, 'protocols');
  
  // Check if protocols directory exists
  if (!fs.existsSync(protocolsDir)) {
    console.log('[Seed] Creating protocols directory...');
    fs.mkdirSync(protocolsDir, { recursive: true });
    
    // Create sample protocol
    const sampleProtocol = {
      doc_id: 'malaria',
      doc_title: 'Malaria Management Protocol',
      sections: [
        {
          title: 'Assessment',
          content: 'Suspect malaria in any patient with fever (≥37.5°C) or history of fever in the past 48 hours. Key symptoms: fever, chills, headache, body aches. Children under 5 and pregnant women are at highest risk. Always perform RDT if available.'
        },
        {
          title: 'Danger Signs',
          content: 'REFER IMMEDIATELY if: Unable to drink or breastfeed, Convulsions, Unconscious or very sleepy, Severe pallor, Very weak. These indicate severe malaria requiring hospital care.'
        },
        {
          title: 'Treatment Under 5',
          content: 'For confirmed uncomplicated malaria in children under 5: ACT (Artemether-Lumefantrine) by weight. 5-14kg: 1 tablet twice daily for 3 days. 15-24kg: 2 tablets twice daily. Give with food. First dose observed.'
        },
        {
          title: 'When to Refer',
          content: 'Refer if: Any danger sign, RDT positive in pregnancy, No improvement after 48 hours, Child under 2 months, Unable to take oral medication, Suspected severe anemia.'
        }
      ]
    };
    
    fs.writeFileSync(
      path.join(protocolsDir, 'malaria.json'),
      JSON.stringify(sampleProtocol, null, 2)
    );
    console.log('[Seed] Created sample malaria protocol');
  }
  
  // Read all protocol files
  const files = fs.readdirSync(protocolsDir).filter(f => f.endsWith('.json'));
  console.log(`[Seed] Found ${files.length} protocol file(s)`);
  
  const insertStmt = db.prepare(`
    INSERT INTO protocol_chunks (doc_id, doc_title, section, chunk_index, content, tokens, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  let totalChunks = 0;
  
  for (const file of files) {
    const filePath = path.join(protocolsDir, file);
    const protocol = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    console.log(`[Seed] Processing: ${protocol.doc_title}`);
    
    protocol.sections.forEach((section, index) => {
      const tokens = tokenize(section.content);
      const tags = extractTags(section.content, protocol.doc_id);
      
      insertStmt.run(
        protocol.doc_id,
        protocol.doc_title,
        section.title,
        index,
        section.content,
        JSON.stringify(tokens),
        JSON.stringify(tags)
      );
      totalChunks++;
    });
  }
  
  console.log(`[Seed] Inserted ${totalChunks} chunks from ${files.length} protocols`);
  console.log('[Seed] Computing IDF values...');
  
  // Recompute IDF (done in retrieval service)
  return totalChunks;
}

// Extract semantic tags from content
function extractTags(content, docId) {
  const tags = [docId];
  const lower = content.toLowerCase();
  
  if (lower.includes('child') || lower.includes('under 5') || lower.includes('pediatric')) {
    tags.push('pediatric');
  }
  if (lower.includes('pregnan')) {
    tags.push('pregnancy');
  }
  if (lower.includes('refer') || lower.includes('danger')) {
    tags.push('urgency');
  }
  if (lower.includes('dose') || lower.includes('tablet') || lower.includes('treatment')) {
    tags.push('treatment');
  }
  
  return tags;
}

// Run if called directly
if (require.main === module) {
  seedProtocols()
    .then(count => {
      console.log(`[Seed] Complete! ${count} chunks seeded.`);
      process.exit(0);
    })
    .catch(err => {
      console.error('[Seed] Error:', err);
      process.exit(1);
    });
}

module.exports = { seedProtocols, tokenize, computeTF };
```

---

## Step 3: Implement TF-IDF Retrieval

Update file `api/src/services/retrieval.js`:

### Copilot Prompt

```
@workspace Implement TF-IDF retrieval service with:
- buildIDF() - Compute inverse document frequency across all chunks
- computeQueryVector(query) - Convert query to TF-IDF vector
- cosineSimilarity(vec1, vec2) - Calculate vector similarity
- searchProtocols(query, topK) - Return top K matching chunks
- Cache IDF values for performance
```

### Expected Code

```javascript
const { getDB } = require('../db/index');
const { tokenize, computeTF } = require('../db/seed');

let cachedIDF = null;
let cachedChunks = null;

// Build IDF from all document chunks
function buildIDF() {
  if (cachedIDF) return cachedIDF;
  
  const db = getDB();
  const chunks = db.prepare('SELECT * FROM protocol_chunks').all();
  
  const documentFrequency = {};
  const N = chunks.length;
  
  // Count document frequency for each term
  chunks.forEach(chunk => {
    const tokens = JSON.parse(chunk.tokens || '[]');
    const uniqueTokens = new Set(tokens);
    
    uniqueTokens.forEach(token => {
      documentFrequency[token] = (documentFrequency[token] || 0) + 1;
    });
  });
  
  // Compute IDF: log(N / df)
  const idf = {};
  Object.keys(documentFrequency).forEach(token => {
    idf[token] = Math.log(N / documentFrequency[token]);
  });
  
  cachedIDF = idf;
  cachedChunks = chunks;
  
  console.log(`[Retrieval] IDF computed for ${Object.keys(idf).length} terms from ${N} chunks`);
  
  return idf;
}

// Compute TF-IDF vector for a query
function computeQueryVector(query) {
  const idf = buildIDF();
  const tokens = tokenize(query);
  const tf = computeTF(tokens);
  
  const vector = {};
  Object.keys(tf).forEach(token => {
    if (idf[token]) {
      vector[token] = tf[token] * idf[token];
    }
  });
  
  return vector;
}

// Compute TF-IDF vector for a document chunk
function computeChunkVector(chunk) {
  const idf = buildIDF();
  const tokens = JSON.parse(chunk.tokens || '[]');
  const tf = computeTF(tokens);
  
  const vector = {};
  Object.keys(tf).forEach(token => {
    if (idf[token]) {
      vector[token] = tf[token] * idf[token];
    }
  });
  
  return vector;
}

// Cosine similarity between two sparse vectors
function cosineSimilarity(vec1, vec2) {
  const keys = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  keys.forEach(key => {
    const v1 = vec1[key] || 0;
    const v2 = vec2[key] || 0;
    
    dotProduct += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  });
  
  const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
  
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

// Search protocols and return top K matches
function searchProtocols(query, topK = 4) {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  const startTime = Date.now();
  
  // Ensure IDF is computed
  buildIDF();
  
  if (!cachedChunks || cachedChunks.length === 0) {
    console.log('[Retrieval] No chunks in database');
    return [];
  }
  
  const queryVector = computeQueryVector(query);
  
  // Score each chunk
  const scored = cachedChunks.map(chunk => {
    const chunkVector = computeChunkVector(chunk);
    const score = cosineSimilarity(queryVector, chunkVector);
    
    return {
      ...chunk,
      score,
      tags: JSON.parse(chunk.tags || '[]'),
    };
  });
  
  // Sort by score and take top K
  const results = scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(r => ({
      doc_id: r.doc_id,
      doc_title: r.doc_title,
      section: r.section,
      content: r.content,
      score: r.score,
      tags: r.tags,
    }));
  
  const duration = Date.now() - startTime;
  console.log(`[Retrieval] Found ${results.length} matches for "${query.slice(0, 30)}..." in ${duration}ms`);
  
  return results;
}

// Invalidate cache (call after seeding)
function invalidateCache() {
  cachedIDF = null;
  cachedChunks = null;
}

module.exports = {
  searchProtocols,
  buildIDF,
  invalidateCache,
};
```

---

## Step 4: Add Seed Script to Package.json

Update `api/package.json`:

```json
{
  "scripts": {
    "dev": "node src/index.js",
    "seed": "node src/db/seed.js",
    "start": "node src/index.js"
  }
}
```

---

## Step 5: Seed the Database

### Create Additional Protocol Files

Create more protocol JSON files in `api/src/db/protocols/`:

**diarrhea.json:**
```json
{
  "doc_id": "diarrhea",
  "doc_title": "Diarrhea Management Protocol",
  "sections": [
    {
      "title": "Assessment",
      "content": "Diarrhea is 3 or more loose/watery stools in 24 hours. Assess: Duration (acute <14 days, persistent 14+ days), Frequency, Blood in stool (dysentery), Dehydration status. Check skin pinch, eyes, thirst, general condition."
    },
    {
      "title": "Dehydration Assessment",
      "content": "NO dehydration: Alert, normal eyes, drinks normally, skin pinch goes back immediately. SOME dehydration: Restless/irritable, sunken eyes, drinks eagerly, skin pinch goes back slowly. SEVERE dehydration: Lethargic/unconscious, very sunken eyes, unable to drink, skin pinch goes back very slowly (>2 seconds). SEVERE = URGENT REFERRAL."
    },
    {
      "title": "Treatment Plan A - No Dehydration",
      "content": "Treat at home: Give ORS after each loose stool (under 2 years: 50-100ml, 2-10 years: 100-200ml, older: as much as wanted). Continue breastfeeding. Give Zinc: 10mg daily for under 6 months, 20mg daily for 6 months and older, for 10-14 days. Continue feeding."
    },
    {
      "title": "Treatment Plan B - Some Dehydration",
      "content": "Give ORS at health post: Calculate 75ml/kg over 4 hours. Give by spoon/cup frequently. Reassess after 4 hours. If improved, teach Plan A and send home with ORS. If no improvement or worsening, refer."
    },
    {
      "title": "When to Refer",
      "content": "Refer urgently if: Severe dehydration, Blood in stool (dysentery), Unable to drink, Persistent vomiting, Convulsions, Child under 2 months with diarrhea. Send with ORS sips during transport."
    }
  ]
}
```

### Run Seeding

```powershell
cd api
npm run seed
```

Expected output:
```
[Seed] Starting database seeding...
[Seed] Found 2 protocol file(s)
[Seed] Processing: Malaria Management Protocol
[Seed] Processing: Diarrhea Management Protocol
[Seed] Inserted 9 chunks from 2 protocols
[Seed] Complete! 9 chunks seeded.
```

---

## Step 6: Test Retrieval

### Via API

```powershell
curl -X POST http://localhost:3001/api/protocols/search `
  -H "Content-Type: application/json" `
  -d '{"query": "child with fever and vomiting", "topK": 3}'
```

Expected response:
```json
[
  {
    "doc_id": "malaria",
    "doc_title": "Malaria Management Protocol",
    "section": "Assessment",
    "content": "Suspect malaria in any patient with fever...",
    "score": 0.45
  },
  ...
]
```

### Via Chat

Ask in chat: "What should I check for a 3-year-old with fever?"

The response should now cite specific protocol sections!

---

## Step 7: Update Index to Seed on Startup

Update `api/src/index.js`:

```javascript
const { seedProtocols } = require('./db/seed');

async function start() {
  try {
    console.log('[AfyaPack] Starting API server...');
    initDB();
    
    // Seed protocols if needed
    const db = getDB();
    const { count } = db.prepare('SELECT COUNT(*) as count FROM protocol_chunks').get();
    if (count === 0) {
      console.log('[AfyaPack] No protocols found, seeding...');
      await seedProtocols();
    } else {
      console.log(`[AfyaPack] ${count} protocol chunks loaded`);
    }
    
    app.listen(PORT, () => {
      console.log(`[AfyaPack] API running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[AfyaPack] Startup failed:', err);
    process.exit(1);
  }
}
```

---

## Validation Checklist

- [ ] `npm run seed` completes without errors
- [ ] `/api/protocols` returns list of protocol documents
- [ ] `/api/protocols/search` returns ranked results
- [ ] Scores decrease as relevance decreases
- [ ] Chat responses now include citations
- [ ] Citations reference actual protocol sections

---

## Understanding TF-IDF

**Term Frequency (TF):** How often a word appears in this document.
- "fever" appears 3 times → higher TF

**Inverse Document Frequency (IDF):** How rare is this word across all documents.
- "the" appears everywhere → low IDF
- "ACT" only in malaria protocol → high IDF

**TF-IDF Score:** TF × IDF
- Common words in document but rare overall → high score
- This identifies the most distinctive terms for each chunk

---

## What You Learned

- How TF-IDF ranking works
- How to tokenize and preprocess text
- How to compute cosine similarity
- How to implement RAG retrieval
- How to ground LLM responses in source documents

---

## Next Step

**Proceed to Lesson 08:** Encounter Triage

You'll build the 4-step patient intake form.

---

*AI responses are now grounded in protocols. Build the intake flow. →*
