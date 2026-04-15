# Setup Guide — AfyaPack Lab

> Complete setup instructions to get your development environment ready.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Install Node.js](#install-nodejs)
3. [Install Git](#install-git)
4. [Install VS Code](#install-vs-code)
5. [Install GitHub Copilot](#install-github-copilot)
6. [Install Foundry Local](#install-foundry-local)
7. [Verify Your Setup](#verify-your-setup)
8. [Optional: Install Ollama (Fallback)](#optional-install-ollama)
9. [Environment Configuration](#environment-configuration)
10. [Troubleshooting](#troubleshooting)

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Windows 10+, macOS 11+, Ubuntu 20.04+ | Windows 11, macOS 14+ |
| **RAM** | 8 GB | 16 GB |
| **Storage** | 10 GB free | 20 GB free |
| **Processor** | 4-core CPU | 8-core CPU with AVX2 |
| **GPU** | Not required | Optional (accelerates inference) |

> **Note:** Foundry Local runs on CPU. No GPU is required. The Qwen 2.5 0.5B model we use is optimized for CPU inference.

---

## Install Node.js

AfyaPack uses Node.js for both the backend (Express) and frontend (Next.js).

### Windows

```powershell
# Option 1: Download from nodejs.org
# Visit https://nodejs.org and download the LTS installer

# Option 2: Using winget
winget install OpenJS.NodeJS.LTS

# Verify installation
node --version    # Should show v18.x or higher
npm --version     # Should show v9.x or higher
```

### macOS

```bash
# Using Homebrew
brew install node@18

# Verify installation
node --version
npm --version
```

### Linux (Ubuntu/Debian)

```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

---

## Install Git

### Windows

```powershell
# Using winget
winget install Git.Git

# Or download from https://git-scm.com/download/windows

# Verify installation
git --version
```

### macOS

```bash
# Git is included with Xcode Command Line Tools
xcode-select --install

# Or using Homebrew
brew install git

# Verify
git --version
```

### Linux

```bash
sudo apt-get install git

# Verify
git --version
```

---

## Install VS Code

Download and install from: https://code.visualstudio.com

### Recommended Extensions

After installing VS Code, install these extensions:

| Extension | Purpose |
|-----------|---------|
| **GitHub Copilot** | AI pair programming |
| **GitHub Copilot Chat** | Conversational AI assistance |
| **ESLint** | JavaScript/TypeScript linting |
| **Prettier** | Code formatting |
| **Tailwind CSS IntelliSense** | CSS class autocomplete |
| **REST Client** | API testing (optional) |
| **SQLite Viewer** | Database inspection (optional) |

**Install via command palette (Ctrl+Shift+P / Cmd+Shift+P):**

```
>Extensions: Install Extension
```

Search for each extension and click Install.

---

## Install GitHub Copilot

### Prerequisites
- Active GitHub Copilot subscription (individual, business, or enterprise)
- GitHub account signed into VS Code

### Installation Steps

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "GitHub Copilot"
4. Install **GitHub Copilot** (by GitHub)
5. Install **GitHub Copilot Chat** (by GitHub)
6. Sign in to GitHub when prompted

### Verify Copilot is Working

1. Create a new file `test.js`
2. Type: `// function to calculate fibonacci`
3. Press Enter and wait — Copilot should suggest code
4. Press Tab to accept

If you see suggestions, Copilot is working!

### Enable Copilot Chat

1. Open the Copilot Chat sidebar (Ctrl+Shift+I / Cmd+Shift+I)
2. Or use keyboard shortcut: Ctrl+I / Cmd+I for inline chat
3. Type a question like "How do I create an Express server?"

---

## Install Foundry Local

Foundry Local is Microsoft's local AI inference runtime.

### Windows

```powershell
# Install using winget
winget install Microsoft.FoundryLocal

# Or download from Microsoft's website (link will be provided at event)

# Verify installation
foundry --version
```

### macOS

```bash
# Download and install from Microsoft's website
# Or use the provided installer for the event

# Verify installation
foundry --version
```

### Download the Model

After installing Foundry Local, you need to download the AI model:

```powershell
# Start the Foundry Local service
foundry local start

# Pull the model we'll use (Qwen 2.5 0.5B)
foundry model pull qwen2.5-0.5b-instruct

# Verify the model is available
foundry model list
```

> **Event Tip:** If bandwidth is limited, models may be pre-loaded on USB drives.

### Test Foundry Local

```powershell
# Check that the API is running
curl http://127.0.0.1:54346/v1/models

# Send a test request
curl http://127.0.0.1:54346/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{"model":"qwen2.5-0.5b-instruct-generic-cpu:4","messages":[{"role":"user","content":"Hello"}],"max_tokens":50}'
```

You should see a JSON response with the model's reply.

---

## Verify Your Setup

Run these commands to confirm everything is ready:

```powershell
# Versions check
node --version      # Should be 18.x or higher
npm --version       # Should be 9.x or higher  
git --version       # Any version
code --version      # Any version
foundry --version   # Any version

# Foundry Local check
foundry local status

# Expected output:
# ✓ Foundry Local is running
# ✓ Models available: qwen2.5-0.5b-instruct-generic-cpu:4
```

### Quick Test Script

Create a file called `verify-setup.js`:

```javascript
// verify-setup.js
const endpoint = 'http://127.0.0.1:54346';

async function test() {
  console.log('Testing Foundry Local connection...\n');
  
  try {
    const res = await fetch(`${endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-0.5b-instruct-generic-cpu:4',
        messages: [{ role: 'user', content: 'Say "setup complete" in 3 words or less.' }],
        max_tokens: 20,
      }),
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    console.log('✓ Foundry Local is working!');
    console.log('✓ Response:', data.choices[0].message.content);
  } catch (err) {
    console.error('✗ Foundry Local test failed:', err.message);
    console.log('\nMake sure:');
    console.log('1. Foundry Local is running (foundry local start)');
    console.log('2. The model is downloaded (foundry model list)');
  }
}

test();
```

Run it:

```powershell
node verify-setup.js
```

---

## Optional: Install Ollama

Ollama is an alternative local inference runtime. AfyaPack supports it as a fallback.

### Windows

```powershell
winget install Ollama.Ollama
```

### macOS

```bash
brew install ollama
```

### Pull a Model

```bash
# Start Ollama
ollama serve

# Pull Mistral (recommended for this lab)
ollama pull mistral:latest

# Or a smaller model
ollama pull phi:latest
```

### Configure as Fallback

Set these environment variables in your `.env` file:

```env
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=mistral:latest
```

AfyaPack will automatically fall back to Ollama if Foundry Local is unavailable.

---

## Environment Configuration

Create a `.env` file in the `api/` folder:

```env
# api/.env

# Server
PORT=3001
WEB_URL=http://localhost:3000

# Foundry Local (primary)
FOUNDRY_ENDPOINT=http://127.0.0.1:54346
FOUNDRY_MODEL=qwen2.5-0.5b-instruct-generic-cpu:4

# Ollama (fallback)
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=mistral:latest

# Optional: OpenAI (cloud fallback)
# OPENAI_API_KEY=your-key-here
# OPENAI_MODEL=gpt-4o-mini
```

---

## Troubleshooting

### Foundry Local Issues

**"Foundry Local is not running"**
```powershell
# Start the service
foundry local start

# Check status
foundry local status
```

**"Model not found"**
```powershell
# List available models
foundry model list

# Pull the model
foundry model pull qwen2.5-0.5b-instruct
```

**"Port 54346 already in use"**
```powershell
# Find what's using the port
netstat -ano | findstr 54346

# Kill the process
taskkill /PID <process_id> /F
```

### Node.js Issues

**"npm: command not found"**
- Reinstall Node.js and ensure it's in your system PATH
- Restart your terminal after installation

**"EACCES permission denied"** (Linux/macOS)
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### VS Code / Copilot Issues

**"Copilot is not suggesting code"**
1. Check you're signed into GitHub (bottom left of VS Code)
2. Verify your Copilot subscription is active
3. Check if Copilot is enabled for the current language

**"Copilot Chat is not available"**
1. Ensure the Copilot Chat extension is installed
2. Restart VS Code
3. Sign out and sign back into GitHub

### Network Issues at Events

If the venue has restrictive WiFi:

1. **Models:** Use USB with pre-downloaded models
2. **npm packages:** Use offline npm cache
3. **Copilot:** Should work as long as VS Code can reach GitHub

---

## Next Steps

Once your setup is verified:

1. Clone the lab repository (if not already done)
2. Navigate to `labs/00-introduction/`
3. Start Lesson 00

```powershell
cd afyapack
code .
# Open labs/00-introduction/README.md
```

**You're ready to build! 🚀**
