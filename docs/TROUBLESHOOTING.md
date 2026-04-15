# Troubleshooting Guide — AfyaPack Lab

> Quick solutions for common issues during the lab.

---

## Table of Contents

1. [Foundry Local Issues](#foundry-local-issues)
2. [Node.js & npm Issues](#nodejs--npm-issues)
3. [VS Code & Copilot Issues](#vs-code--copilot-issues)
4. [API Server Issues](#api-server-issues)
5. [Frontend Issues](#frontend-issues)
6. [Database Issues](#database-issues)
7. [AI Response Issues](#ai-response-issues)
8. [Network Issues](#network-issues)
9. [Checkpoint Recovery](#checkpoint-recovery)

---

## Foundry Local Issues

### "Foundry Local is not running"

**Symptoms:**
- `curl http://127.0.0.1:54346/v1/models` fails
- Chat returns "Unable to connect to AI"

**Fix:**
```powershell
# Start Foundry Local
foundry local start

# Verify it's running
foundry local status

# Check the port is listening
netstat -ano | findstr 54346
```

### "Model not found" or "No models available"

**Symptoms:**
- Foundry Local runs but model list is empty
- Error: "Model qwen2.5-0.5b-instruct not found"

**Fix:**
```powershell
# List available models
foundry model list

# Pull the model
foundry model pull qwen2.5-0.5b-instruct

# Wait for download to complete, then verify
foundry model list
```

### "Port 54346 already in use"

**Symptoms:**
- Foundry Local fails to start
- "Address already in use" error

**Fix:**
```powershell
# Find what's using the port
netstat -ano | findstr 54346

# Note the PID (last column) and kill it
taskkill /PID <pid> /F

# Restart Foundry Local
foundry local start
```

### Foundry Local is slow

**Normal behavior:** First request takes 10-30 seconds (model loading).  
Subsequent requests should be faster (1-5 seconds).

**If consistently slow:**
```powershell
# Check CPU usage
# Foundry Local uses CPU inference — expect high CPU during generation

# Reduce max_tokens in your code
max_tokens: 400  # instead of 700

# Consider using a smaller model
foundry model pull phi3-mini
```

### Foundry Local crashes

**Try:**
```powershell
# Clean restart
foundry local stop
foundry local start

# Check logs
foundry logs --tail 50

# Reinstall if needed
winget uninstall Microsoft.FoundryLocal
winget install Microsoft.FoundryLocal
```

---

## Node.js & npm Issues

### "npm: command not found"

**Fix:**
1. Reinstall Node.js from https://nodejs.org
2. Restart your terminal
3. Verify: `node --version`

### "EACCES permission denied"

**Fix (Linux/macOS):**
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### "npm install" hangs or fails

**Fix:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and lock file
rm -r node_modules
rm package-lock.json

# Fresh install
npm install
```

### "better-sqlite3" build errors

This package has native dependencies. If build fails:

**Windows:**
```powershell
# Install build tools
npm install -g windows-build-tools

# Or install Visual Studio Build Tools separately
# Then retry npm install
```

**macOS:**
```bash
xcode-select --install
npm install
```

---

## VS Code & Copilot Issues

### Copilot is not suggesting code

**Checklist:**
1. Are you signed into GitHub? (Check bottom-left corner)
2. Is your Copilot subscription active? (github.com/settings/copilot)
3. Is Copilot enabled for this file type?

**Fix:**
```
# Restart VS Code
# Or sign out and sign back into GitHub

# Check Copilot status bar (bottom right)
# Should show "Copilot" with a checkmark
```

### Copilot Chat is not available

**Fix:**
1. Ensure `GitHub Copilot Chat` extension is installed
2. Restart VS Code
3. Open the Chat sidebar: Ctrl+Shift+I / Cmd+Shift+I

### Copilot gives irrelevant suggestions

**Tips:**
- Add more context in comments before your code
- Use explicit file names and function names
- Open related files in tabs (Copilot sees them)
- Use the prompt library instead of free-form

### Extension host crashes

**Fix:**
```
# Disable all extensions, then re-enable one by one
# Code > Preferences > Extensions
# Click "..." > Disable All Installed Extensions

# Clear extension cache
# Windows: %APPDATA%\Code\CachedExtensions
# macOS: ~/Library/Application Support/Code/CachedExtensions
```

---

## API Server Issues

### "Port 3001 already in use"

**Fix:**
```powershell
# Find and kill the process
netstat -ano | findstr 3001
taskkill /PID <pid> /F

# Or use a different port
PORT=3002 npm run dev:api
```

### "Cannot find module" errors

**Fix:**
```powershell
cd api
rm -r node_modules
npm install
```

### API not responding

**Debug:**
```powershell
# Check if server is running
curl http://localhost:3001/api/health

# Check server logs in terminal
# Look for error messages

# Restart the server
npm run dev:api
```

### CORS errors

**Symptoms:**
- Browser console shows "Access-Control-Allow-Origin" errors
- API works in terminal but not from frontend

**Fix:**
Check `api/src/index.js`:
```javascript
const ALLOWED_ORIGINS = [
  'http://localhost:3000',  // Make sure your frontend URL is here
  'http://127.0.0.1:3000',
];
```

Restart the API server after changes.

---

## Frontend Issues

### "Module not found" errors

**Fix:**
```powershell
cd web
rm -r node_modules .next
npm install
npm run dev
```

### Blank page / nothing renders

**Debug:**
1. Check browser console for errors (F12)
2. Check terminal for Next.js errors
3. Verify API is running at localhost:3001

### Hydration errors

**Symptoms:**
- Console shows "Hydration failed" or "Text content mismatch"

**Fix:**
- Usually caused by browser extensions interfering
- Try incognito/private window
- Or disable extensions

### Styles not loading

**Fix:**
```powershell
# Rebuild Tailwind
cd web
rm -r .next
npm run dev
```

---

## Database Issues

### "No protocols loaded" / Protocol count is 0

**Fix:**
```powershell
# Re-seed the database
cd api
node src/db/seed.js

# Restart the API
npm run dev:api
```

### Database is locked

**Symptoms:**
- "SQLITE_BUSY" errors
- Operations hang

**Fix:**
```powershell
# Stop all Node processes
taskkill /IM node.exe /F

# Delete the database file (if using file-based)
rm api/data/afyapack.db

# Restart and re-seed
cd api
npm run dev
# The database will be recreated
```

### Encounters not saving

**Debug:**
1. Check API response in browser Network tab
2. Look for error messages in API terminal
3. Verify database schema is correct

---

## AI Response Issues

### AI returns empty responses

**Possible causes:**
1. Model not loaded — check `foundry model list`
2. Timeout — increase timeout in code
3. Token limit too low — increase `max_tokens`

**Debug:**
```powershell
# Test directly
curl http://127.0.0.1:54346/v1/chat/completions ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"qwen2.5-0.5b-instruct-generic-cpu:4\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}],\"max_tokens\":50}"
```

### AI responses are generic / not grounded

**Check:**
1. Are protocols loaded? (Dashboard should show protocol count)
2. Is retrieval working? (Check `citations` array in response)
3. Is the system prompt correct?

**Fix:**
```powershell
# Re-seed protocols
cd api
node src/db/seed.js
```

### Mock mode responses only

**Symptoms:**
- Responses say "[Demo mode — connect to Foundry Local]"

**This means no AI is available:**
```powershell
# Start Foundry Local
foundry local start

# Or start Ollama
ollama serve

# Restart API
npm run dev:api
```

---

## Network Issues

### GitHub Copilot not connecting

**Requires internet.** If on restricted WiFi:
1. Check if GitHub is reachable: `ping github.com`
2. Try personal hotspot
3. Use VPN if corporate firewall blocks

### npm install fails (network)

**Fix:**
```powershell
# Use a different registry
npm config set registry https://registry.npmmirror.com

# Or use offline cache if provided
npm install --offline
```

### Foundry model download fails

**At events:**
- Use USB drive with pre-downloaded models
- Ask instructor for local copy

---

## Checkpoint Recovery

If you're stuck, use the checkpoint system to catch up.

### Available Checkpoints

| Checkpoint | State |
|------------|-------|
| `starter/lesson-01` | Empty project ready for scaffolding |
| `checkpoints/lesson-04` | Backend API complete |
| `checkpoints/lesson-06` | Chat UI working |
| `checkpoints/lesson-09` | Core app complete |
| `final/` | Complete finished app |

### How to Use

```powershell
# Option 1: Copy checkpoint to your workspace
cp -r checkpoints/lesson-06/* ./

# Option 2: Reset and copy
rm -r api web
cp -r checkpoints/lesson-06/api ./api
cp -r checkpoints/lesson-06/web ./web

# Then reinstall dependencies
npm run install:all

# Start the app
npm run dev
```

### When to Use

- **Behind by 10+ minutes:** Copy checkpoint and catch up
- **Build errors you can't fix:** Start fresh from checkpoint
- **Feature doesn't work:** Compare your code with checkpoint

---

## Quick Reference Commands

```powershell
# Foundry Local
foundry local start
foundry local stop
foundry local status
foundry model list
foundry model pull qwen2.5-0.5b-instruct

# Project
npm run install:all
npm run dev
npm run dev:api
npm run dev:web

# Database
cd api && node src/db/seed.js

# Cleanup
rm -r node_modules
rm -r api/node_modules
rm -r web/node_modules
npm cache clean --force
```

---

## Still Stuck?

1. **Raise your hand** — TAs and instructors are here to help
2. **Check the prompt library** — Exact prompts that work
3. **Use a checkpoint** — Don't fall too far behind
4. **Pair with a neighbor** — Two heads are better than one

**Remember:** The goal is learning, not perfection. If something isn't working, move on and come back to it.
