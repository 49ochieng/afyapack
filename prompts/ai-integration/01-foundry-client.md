# Prompt: Foundry Local Client

## Description
Create a service module that connects to Foundry Local for AI chat completions with automatic fallback support.

---

## The Prompt

```
Create a JavaScript service module that:
1. Connects to Foundry Local at http://127.0.0.1:54346
2. Uses the OpenAI SDK for API compatibility
3. Implements provider detection (checks which AI service is available)
4. Has fallback chain: Foundry Local → Ollama → Mock response
5. Exports a generateResponse function that takes messages array and options
6. Handles errors gracefully with meaningful error messages
7. Supports streaming responses with an optional callback

Use environment variables for URLs. Include JSDoc comments.
```

---

## Expected Output

```javascript
import OpenAI from 'openai';

const PROVIDERS = {
  foundry: {
    baseURL: process.env.FOUNDRY_URL || 'http://127.0.0.1:54346/v1',
    model: 'qwen2.5-0.5b-instruct-generic-cpu:4'
  },
  ollama: {
    baseURL: process.env.OLLAMA_URL || 'http://127.0.0.1:11434/v1',
    model: 'mistral:latest'
  }
};

let activeProvider = null;
let client = null;

/**
 * Detect which AI provider is available
 */
async function detectProvider() {
  for (const [name, config] of Object.entries(PROVIDERS)) {
    try {
      const testClient = new OpenAI({
        baseURL: config.baseURL,
        apiKey: 'not-needed'
      });
      await testClient.models.list();
      return { name, config, client: testClient };
    } catch (e) {
      continue;
    }
  }
  return null;
}

/**
 * Generate a response using the active AI provider
 */
export async function generateResponse(messages, options = {}) {
  if (!client) {
    const provider = await detectProvider();
    if (provider) {
      activeProvider = provider.name;
      client = provider.client;
    }
  }

  if (!client) {
    return { 
      response: 'AI service unavailable. Please ensure Foundry Local is running.',
      provider: 'mock'
    };
  }

  const completion = await client.chat.completions.create({
    model: PROVIDERS[activeProvider].model,
    messages,
    max_tokens: options.maxTokens || 512,
    temperature: options.temperature || 0.3,
    stream: options.stream || false
  });

  if (options.stream) {
    return { stream: completion, provider: activeProvider };
  }

  return {
    response: completion.choices[0].message.content,
    provider: activeProvider
  };
}

export function getActiveProvider() {
  return activeProvider;
}
```

---

## Variations

### Minimal (No Fallback)
```
Create a simple Foundry Local client using OpenAI SDK that connects to http://127.0.0.1:54346/v1 and generates chat completions. Export a single generateResponse function.
```

### With Streaming
```
Create a Foundry Local client that supports streaming responses. The generateResponse function should accept an onToken callback that fires for each token received.
```

### With Retry Logic
```
Create a Foundry Local client with exponential backoff retry logic. Retry up to 3 times on network errors with increasing delays.
```

---

## Usage Context

Use this prompt when:
- Starting AI integration in a Node.js project
- Need resilient LLM connectivity
- Working with local AI models
- Building offline-capable AI apps

---

## Dependencies

```json
{
  "openai": "^4.0.0"
}
```
