# Lesson 01: Setup & Environment

> Get your development environment ready for building AfyaPack.

---

## Lesson Overview

| | |
|---|---|
| **Duration** | 15 minutes |
| **Objective** | Install and verify all required tools |
| **Output** | Working development environment |
| **Prerequisites** | None |
| **Files/Folders** | None yet (setup only) |

---

## What You'll Install

| Tool | Purpose |
|------|---------|
| **Node.js 18+** | JavaScript runtime for backend and frontend |
| **VS Code** | Editor with Copilot support |
| **GitHub Copilot** | AI pair programmer |
| **Git** | Version control |
| **Foundry Local** | Local AI inference (next lesson) |

---

## Step 1: Install Node.js

### Windows (PowerShell)

```powershell
# Option 1: Using winget (recommended)
winget install OpenJS.NodeJS.LTS

# Option 2: Download from https://nodejs.org
```

### macOS

```bash
brew install node@18
```

### Linux

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Verify Installation

```powershell
node --version    # Should show v18.x or higher
npm --version     # Should show v9.x or higher
```

**✓ Checkpoint:** Both commands output version numbers.

---

## Step 2: Install VS Code

Download and install from: https://code.visualstudio.com

After installation, launch VS Code and install these extensions:

### Required Extensions

1. **GitHub Copilot** (by GitHub)
   - Search: `GitHub.copilot`
   - Click Install

2. **GitHub Copilot Chat** (by GitHub)
   - Search: `GitHub.copilot-chat`
   - Click Install

### Recommended Extensions

| Extension | Purpose |
|-----------|---------|
| ESLint | JavaScript linting |
| Prettier | Code formatting |
| Tailwind CSS IntelliSense | CSS class suggestions |

### Sign into GitHub

1. Look at the bottom-left corner of VS Code
2. Click the account icon
3. Sign in with your GitHub account
4. Authorize GitHub Copilot

**✓ Checkpoint:** Bottom-left shows your GitHub username.

---

## Step 3: Verify GitHub Copilot

### Test Autocomplete

1. Create a new file: `test.js`
2. Type this comment:
   ```javascript
   // function to calculate fibonacci
   ```
3. Press Enter
4. Wait 1-2 seconds — Copilot should suggest a function

If you see a grayed-out suggestion, **press Tab to accept**.

### Test Copilot Chat

1. Press `Ctrl+Shift+I` (Windows) or `Cmd+Shift+I` (Mac)
2. The Copilot Chat sidebar should open
3. Type: "How do I create an Express.js server?"
4. You should get a helpful response

**✓ Checkpoint:** Both autocomplete and chat are working.

---

## Step 4: Install Git

### Windows

```powershell
winget install Git.Git
```

### macOS

```bash
xcode-select --install
```

### Linux

```bash
sudo apt-get install git
```

### Verify

```powershell
git --version
```

**✓ Checkpoint:** Git version is displayed.

---

## Step 5: Clone the Lab Repository

```powershell
# Navigate to where you want the project
cd C:\projects  # or your preferred folder

# Clone the repository
git clone https://github.com/your-org/afyapack.git

# Enter the project
cd afyapack

# Open in VS Code
code .
```

**✓ Checkpoint:** VS Code opens with the AfyaPack project.

---

## Environment Verification Script

Create a file called `verify-setup.js` in the project root:

```javascript
// verify-setup.js
// Run with: node verify-setup.js

console.log('AfyaPack Environment Verification\n');
console.log('='.repeat(40));

// Check Node.js
const nodeVersion = process.version;
const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
if (nodeMajor >= 18) {
  console.log(`✓ Node.js: ${nodeVersion}`);
} else {
  console.log(`✗ Node.js: ${nodeVersion} (need 18+)`);
}

// Check npm
const { execSync } = require('child_process');
try {
  const npmVersion = execSync('npm --version').toString().trim();
  console.log(`✓ npm: ${npmVersion}`);
} catch {
  console.log('✗ npm: not found');
}

// Check git
try {
  const gitVersion = execSync('git --version').toString().trim();
  console.log(`✓ Git: ${gitVersion.replace('git version ', '')}`);
} catch {
  console.log('✗ Git: not found');
}

console.log('\n' + '='.repeat(40));
console.log('Next: Install Foundry Local (Lesson 02)');
```

Run it:

```powershell
node verify-setup.js
```

**Expected output:**
```
AfyaPack Environment Verification

========================================
✓ Node.js: v18.18.0
✓ npm: 9.8.1
✓ Git: 2.42.0

========================================
Next: Install Foundry Local (Lesson 02)
```

---

## Copilot Prompt Practice

Before moving on, try these prompts in Copilot Chat to get comfortable:

### Prompt 1: Information Query
```
What is Foundry Local and how does it differ from OpenAI's API?
```

### Prompt 2: Code Generation
```
Generate a simple Node.js HTTP server that responds with "Hello, AfyaPack!"
```

### Prompt 3: Explanation
```
Explain what TF-IDF is in one paragraph suitable for a developer.
```

---

## Validation Checklist

Before proceeding to Lesson 02, verify:

- [ ] `node --version` shows 18.x or higher
- [ ] `npm --version` shows 9.x or higher
- [ ] `git --version` works
- [ ] VS Code is installed
- [ ] GitHub Copilot extension is installed
- [ ] GitHub Copilot Chat extension is installed
- [ ] Signed into GitHub in VS Code
- [ ] Copilot autocomplete is working
- [ ] Copilot Chat responds to queries
- [ ] AfyaPack repo is cloned

---

## Troubleshooting

### "npm: command not found"
- Restart your terminal after installing Node.js
- On Windows, reopen PowerShell as Administrator

### "Copilot not suggesting code"
- Check bottom-right of VS Code for Copilot icon
- Ensure you're signed into GitHub
- Verify your Copilot subscription at github.com/settings/copilot

### "Cannot clone repository"
- Check your internet connection
- If using SSH, ensure your key is set up
- Try HTTPS URL instead of SSH

---

## Stretch Goal

If you have extra time:

Create a simple package.json using Copilot:

1. Create a new file `package.json`
2. Type `{` and pause
3. Let Copilot suggest the structure
4. Accept and refine as needed

This gives you a preview of how we'll scaffold the project in Lesson 03.

---

## What You Learned

- How to install Node.js, npm, and Git
- How to set up VS Code with GitHub Copilot
- How to verify your environment is ready
- How to use Copilot for basic prompts

---

## Next Step

**Proceed to Lesson 02:** Foundry Local Setup

You'll install and test the local AI runtime.

---

*Your environment is ready. Let's add the AI. →*
