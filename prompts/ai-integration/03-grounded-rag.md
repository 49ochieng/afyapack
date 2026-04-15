# Prompt: RAG (Retrieval Augmented Generation)

## Description
Implement a complete RAG pipeline that grounds AI responses in retrieved documents for factual accuracy.

---

## The Prompt

```
Create a RAG (Retrieval Augmented Generation) pipeline that:
1. Accepts a user query
2. Searches a document corpus for relevant context
3. Formats context into a prompt
4. Sends to LLM with grounding instructions
5. Returns response with source citations
6. Handles cases where no relevant context is found
7. Limits context to fit token budget

Design for a health application where accuracy and citations matter.
```

---

## Expected Output

### api/src/services/rag.js
```javascript
import { search } from './retrieval.js';
import { generateResponse } from './foundry.js';
import { SYSTEM_PROMPTS } from './prompts.js';

const MAX_CONTEXT_CHUNKS = 4;
const MAX_CONTEXT_CHARS = 3000;

/**
 * Perform RAG: retrieve context and generate grounded response
 * @param {string} query - User's question
 * @param {Object} options - Configuration options
 * @returns {Object} - { response, citations, grounded }
 */
export async function ragQuery(query, options = {}) {
  // 1. Retrieve relevant context
  const relevantChunks = search(query, MAX_CONTEXT_CHUNKS);
  
  // 2. Check if we have context
  const hasContext = relevantChunks.length > 0;
  
  // 3. Format context for prompt
  let contextText = '';
  let totalChars = 0;
  const usedChunks = [];
  
  for (const chunk of relevantChunks) {
    const chunkText = `[${chunk.title}]\n${chunk.content}\n\n`;
    
    if (totalChars + chunkText.length > MAX_CONTEXT_CHARS) {
      break;
    }
    
    contextText += chunkText;
    totalChars += chunkText.length;
    usedChunks.push({
      id: chunk.id,
      title: chunk.title,
      score: chunk.relevanceScore
    });
  }
  
  // 4. Build messages
  const systemPrompt = hasContext 
    ? buildGroundedPrompt(contextText)
    : buildUngroundedPrompt();
  
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: query }
  ];
  
  // 5. Generate response
  const result = await generateResponse(messages, {
    temperature: 0.3,  // Lower for more factual responses
    maxTokens: options.maxTokens || 512
  });
  
  // 6. Return with metadata
  return {
    response: result.response,
    citations: usedChunks,
    grounded: hasContext,
    provider: result.provider,
    query: query
  };
}

function buildGroundedPrompt(context) {
  return `You are AfyaPack, a health assistant for community health workers in Tanzania.

IMPORTANT INSTRUCTIONS:
- Base your response ONLY on the reference information provided below
- If the information doesn't answer the question, say so clearly
- Use simple language appropriate for community health workers
- Include relevant safety warnings
- Reference the source when making specific claims

REFERENCE INFORMATION:
${context}

RESPONSE GUIDELINES:
- Keep responses concise and actionable
- Use bullet points for clarity
- Always mention when to seek professional help
- End with key safety reminders`;
}

function buildUngroundedPrompt() {
  return `You are AfyaPack, a health assistant for community health workers in Tanzania.

IMPORTANT: No relevant reference documents were found for this query.

Guidelines:
- Provide general health guidance based on your training
- Clearly state that you couldn't find specific protocol references
- Recommend consulting official guidelines or supervisors for specific cases
- Keep the response helpful but appropriately cautious
- Suggest the user rephrase or try a more specific question`;
}

/**
 * RAG with chat history context
 */
export async function ragChat(messages, options = {}) {
  // Get the latest user message for retrieval
  const userMessages = messages.filter(m => m.role === 'user');
  const latestQuery = userMessages[userMessages.length - 1]?.content || '';
  
  // Retrieve context based on latest query
  const relevantChunks = search(latestQuery, MAX_CONTEXT_CHUNKS);
  
  // Build system message with context
  let contextText = relevantChunks
    .map(c => `[${c.title}]: ${c.content}`)
    .join('\n\n');
  
  if (contextText.length > MAX_CONTEXT_CHARS) {
    contextText = contextText.slice(0, MAX_CONTEXT_CHARS) + '...';
  }
  
  const systemMessage = {
    role: 'system',
    content: relevantChunks.length > 0
      ? buildGroundedPrompt(contextText)
      : buildUngroundedPrompt()
  };
  
  // Combine: system + history + latest
  const fullMessages = [
    systemMessage,
    ...messages.slice(-6)  // Keep last 6 messages for context
  ];
  
  const result = await generateResponse(fullMessages, options);
  
  return {
    response: result.response,
    citations: relevantChunks.map(c => ({ id: c.id, title: c.title })),
    grounded: relevantChunks.length > 0,
    provider: result.provider
  };
}
```

---

## RAG Pipeline Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                        USER QUERY                           │
│            "How do I treat malaria in children?"            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      RETRIEVAL                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  TF-IDF Search in Protocol Corpus                   │   │
│  │  → "malaria" "treat" "children"                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  Top 4 Chunks:                                              │
│  1. [Malaria Treatment] Score: 0.82                        │
│  2. [Pediatric Dosing] Score: 0.65                         │
│  3. [Fever Management] Score: 0.58                         │
│  4. [Emergency Signs] Score: 0.45                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   PROMPT CONSTRUCTION                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  System: You are AfyaPack...                        │   │
│  │  REFERENCE INFORMATION:                             │   │
│  │  [Malaria Treatment] For uncomplicated malaria...   │   │
│  │  [Pediatric Dosing] Children under 5 should...      │   │
│  │  ...                                                │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  User: How do I treat malaria in children?          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     LLM GENERATION                          │
│  Foundry Local (Qwen 2.5 0.5B)                             │
│  Temperature: 0.3 (more deterministic)                      │
│  Max Tokens: 512                                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   GROUNDED RESPONSE                         │
│  {                                                          │
│    response: "Based on the malaria treatment protocol...",  │
│    citations: [                                             │
│      { title: "Malaria Treatment", score: 0.82 },          │
│      { title: "Pediatric Dosing", score: 0.65 }            │
│    ],                                                       │
│    grounded: true                                           │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Principles

### 1. Relevance Threshold
Only use chunks above a minimum relevance score:
```javascript
const relevantChunks = search(query, 10)
  .filter(c => c.relevanceScore > 0.3);
```

### 2. Token Budget Management
Truncate context to fit model limits:
```javascript
const MAX_CONTEXT_TOKENS = 1500;  // Leave room for response
```

### 3. Citation Transparency
Always show users WHERE information came from:
```javascript
citations: usedChunks.map(c => ({
  id: c.id,
  title: c.title,
  section: c.section
}))
```

### 4. Fallback Handling
Be transparent when no relevant context exists:
```javascript
if (!hasContext) {
  // Use different system prompt
  // Warn user about lack of grounding
}
```

---

## Variations

### Hybrid Retrieval
```
Combine TF-IDF with keyword matching and semantic similarity (if embeddings available) for better recall.
```

### Multi-Query RAG
```
Generate multiple search queries from the user question to improve retrieval coverage.
```

### Reranking
```
Add a reranking step that uses the LLM to score retrieved chunks before including them in context.
```
