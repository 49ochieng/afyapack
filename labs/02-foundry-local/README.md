# Lesson 02: Foundry Local Setup

> Install the local AI runtime and test your first inference.

---

## Lesson Overview

| | |
|---|---|
| **Duration** | 20 minutes |
| **Objective** | Install Foundry Local, download a model, test inference |
| **Output** | Working local AI endpoint at http://127.0.0.1:54346 |
| **Prerequisites** | Lesson 01 (Node.js, VS Code, Copilot) |
| **Files/Folders** | None yet |

---

## What is Foundry Local?

**Foundry Local** is Microsoft's local AI inference runtime. It lets you:

- Run AI models **entirely on your machine**
- Access them via an **OpenAI-compatible API**
- Work **offline** with no cloud dependencies
- Keep **data private** — nothing leaves your device

### Why This Matters for AfyaPack

We're building a health app that handles patient data. Local inference means:
- Patient symptoms never sent to external servers
- App works in remote clinics with no internet
- No API costs per request
- Consistent, reproducible behavior

---

## Step 1: Install Foundry Local

### Windows

```powershell
# Install via winget
winget install Microsoft.FoundryLocal

# Verify installation
foundry --version
```

### macOS

```bash
# Download installer from Microsoft (link provided at event)
# Or use brew if available:
brew install foundry-local

# Verify
foundry --version
```

**✓ Checkpoint:** `foundry --version` displays a version number.

---

## Step 2: Start Foundry Local

```powershell
# Start the local service
foundry local start

# Check status
foundry local status
```

**Expected output:**
```
✓ Foundry Local is running
  Endpoint: http://127.0.0.1:54346
  Status: Ready
```

### What Just Happened?

Foundry Local started a local server that exposes an OpenAI-compatible API. Any code that can call OpenAI can now call your local model instead.

---

## Step 3: Download a Model

We'll use **Qwen 2.5 (0.5B)** — a small, fast model optimized for CPU inference.

```powershell
# List available models
foundry model list

# Pull (download) the model we need
foundry model pull qwen2.5-0.5b-instruct

# Verify it's downloaded
foundry model list
```

**Expected output:**
```
Available models:
  qwen2.5-0.5b-instruct-generic-cpu:4  (548 MB)
```

> **Note:** First download may take 5-10 minutes depending on your internet speed.

### Why This Model?

| Factor | Why Qwen 2.5 0.5B |
|--------|-------------------|
| **Size** | 548 MB — fits on any machine |
| **Speed** | Fast inference on CPU (no GPU needed) |
| **Capability** | Good at following instructions |
| **Trade-off** | Less capable than larger models, but faster and more accessible |

---

## Step 4: Test the Endpoint

### Using curl

```powershell
# Windows PowerShell
curl http://127.0.0.1:54346/v1/models

# Should list your model
```

### First AI Request

```powershell
# Send a chat completion request
curl http://127.0.0.1:54346/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{
    "model": "qwen2.5-0.5b-instruct-generic-cpu:4",
    "messages": [{"role": "user", "content": "Say hello in one sentence."}],
    "max_tokens": 50
  }'
```

**Expected response:**
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Hello! How can I assist you today?"
    }
  }]
}
```

**✓ Checkpoint:** You received an AI-generated response from your local machine.

---

## Step 5: Test with JavaScript

Create a file `test-foundry.js`:

```javascript
// test-foundry.js
// Test Foundry Local connection from Node.js

const ENDPOINT = 'http://127.0.0.1:54346';
const MODEL = 'qwen2.5-0.5b-instruct-generic-cpu:4';

async function testFoundry() {
  console.log('Testing Foundry Local...\n');
  
  const response = await fetch(`${ENDPOINT}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a helpful health assistant.' },
        { role: 'user', content: 'What are the signs of dehydration in a child?' }
      ],
      max_tokens: 150,
      temperature: 0.3,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  const data = await response.json();
  const reply = data.choices[0].message.content;
  
  console.log('Response from local AI:');
  console.log('-'.repeat(40));
  console.log(reply);
  console.log('-'.repeat(40));
  console.log('\n✓ Foundry Local is working!');
}

testFoundry().catch(err => {
  console.error('✗ Test failed:', err.message);
  console.log('\nMake sure:');
  console.log('1. Foundry Local is running (foundry local start)');
  console.log('2. Model is downloaded (foundry model list)');
});
```

Run it:

```powershell
node test-foundry.js
```

**Expected output:**
```
Testing Foundry Local...

Response from local AI:
----------------------------------------
Signs of dehydration in a child include:
1. Dry mouth and tongue
2. Sunken eyes
3. No tears when crying
4. Decreased urination
5. Lethargy or irritability
...
----------------------------------------

✓ Foundry Local is working!
```

---

## Understanding the API

The Foundry Local API mirrors OpenAI's Chat Completions API:

```javascript
{
  model: 'qwen2.5-0.5b-instruct-generic-cpu:4',  // Which model to use
  messages: [
    { role: 'system', content: '...' },  // System instructions
    { role: 'user', content: '...' },    // User message
  ],
  max_tokens: 150,      // Maximum response length
  temperature: 0.3,     // Lower = more deterministic
}
```

### Key Parameters

| Parameter | Purpose | For AfyaPack |
|-----------|---------|--------------|
| `model` | Which model to use | Our Qwen model |
| `messages` | Conversation history | System prompt + user question |
| `max_tokens` | Response length limit | 700 for full guidance |
| `temperature` | Creativity (0-2) | 0.3 for consistent, safe responses |

---

## Copilot Prompt: Explain the Code

Ask Copilot Chat:

```
@workspace I'm learning how Foundry Local works. 

Looking at test-foundry.js, explain:
1. What does each parameter in the request body do?
2. Why do we use temperature 0.3?
3. What happens if the model takes too long to respond?
```

This is a good pattern: **use Copilot to deepen understanding**, not just generate code.

---

## Why Local AI Matters

### The Privacy Advantage

```
Cloud AI:
User → Internet → Cloud Server → Response
         ↑
    Patient data travels here!

Local AI (Foundry Local):
User → Local Model → Response
         ↑
    Data stays on device
```

### The Offline Advantage

```
Cloud AI without internet: ❌ Won't work
Local AI without internet: ✓ Works perfectly
```

For a health app in a remote clinic, this is the difference between usable and unusable.

---

## Validation Checklist

Before proceeding to Lesson 03, verify:

- [ ] `foundry --version` works
- [ ] `foundry local status` shows "Running"
- [ ] `foundry model list` shows `qwen2.5-0.5b-instruct`
- [ ] curl request to `/v1/models` succeeds
- [ ] `node test-foundry.js` gets an AI response

---

## Troubleshooting

### "foundry: command not found"
- Reinstall Foundry Local
- Restart your terminal
- Add to PATH manually if needed

### "Model not found in list"
```powershell
foundry model pull qwen2.5-0.5b-instruct
```

### "Connection refused"
```powershell
foundry local start
```

### First request is very slow
- This is normal! The model loads on first request.
- Subsequent requests will be faster.

### Timeout errors
- Increase timeout in your code
- Or reduce `max_tokens`

---

## Stretch Goal

Try a more complex prompt:

```javascript
const messages = [
  { 
    role: 'system', 
    content: `You are a clinical decision support assistant.
    Never diagnose. Only suggest assessments.
    Always recommend referral when uncertain.` 
  },
  { 
    role: 'user', 
    content: 'A 2-year-old has fever 39.5°C and diarrhea for 2 days. Unable to drink.' 
  }
];
```

Observe how the system prompt constrains the response.

---

## What You Learned

- What Foundry Local is and why it matters
- How to install, start, and configure Foundry Local
- How to download models
- How to make API requests to local AI
- The key parameters for chat completions
- Why local AI is essential for privacy-sensitive apps

---

## Next Step

**Proceed to Lesson 03:** Project Scaffolding

You'll create the project structure using GitHub Copilot.

---

*Local AI is running. Now let's build the app. →*
