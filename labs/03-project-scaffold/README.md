# Lesson 03: Project Scaffolding

> Create the project structure using GitHub Copilot.

---

## Lesson Overview

| | |
|---|---|
| **Duration** | 20 minutes |
| **Objective** | Scaffold a monorepo with API and web folders |
| **Output** | Project structure with package.json files |
| **Prerequisites** | Lesson 02 (Foundry Local running) |
| **Files/Folders** | `api/`, `web/`, `package.json` |

---

## Project Architecture

We're building a monorepo with two main parts:

```
afyapack/
├── package.json          # Root: scripts to run both
├── api/                  # Express.js backend
│   ├── package.json
│   └── src/
│       ├── index.js     # Server entry
│       ├── routes/      # API endpoints
│       ├── services/    # AI integration
│       └── db/          # Database
└── web/                  # Next.js frontend
    ├── package.json
    └── src/
        ├── app/         # Pages
        └── components/  # UI components
```

---

## Step 1: Create Root Package.json

> **This is your first real Copilot prompt for scaffolding.**

Create a new file `package.json` in the project root.

### The Prompt

Open Copilot Chat (`Ctrl+Shift+I`) and type:

```
Create a package.json for a monorepo called "afyapack" with:
- Scripts to run both API and web simultaneously using concurrently
- A script to install all dependencies in root, api, and web folders
- Dev scripts for api-only and web-only development
- Version 1.0.0, private: true
```

### Expected Output

Copilot should generate something like:

```json
{
  "name": "afyapack",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "concurrently -n API,WEB -c cyan,magenta \"npm run dev --prefix api\" \"npm run dev --prefix web\"",
    "dev:api": "npm run dev --prefix api",
    "dev:web": "npm run dev --prefix web",
    "install:all": "npm install && npm install --prefix api && npm install --prefix web",
    "build:web": "npm run build --prefix web",
    "start": "concurrently -n API,WEB \"npm run start --prefix api\" \"npm run start --prefix web\""
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

### Why This Prompt Works

| Element | Purpose |
|---------|---------|
| **Clear task** | "Create a package.json" |
| **Context** | "monorepo called afyapack" |
| **Specific requirements** | Scripts, concurrently, install:all |
| **Constraints** | "Version 1.0.0, private: true" |

This is **good prompt engineering**: specific, structured, and complete.

---

## Step 2: Create API Package.json

Create folder `api/` and file `api/package.json`.

### The Prompt

```
@workspace Create a package.json for an Express.js API with:
- Name: afyapack-api
- Dependencies: express, cors, dotenv, better-sqlite3, uuid
- Dev dependencies: nodemon
- Scripts: dev (nodemon), start (node)
- Entry point: src/index.js
- Type: commonjs
```

### Expected Output

```json
{
  "name": "afyapack-api",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "better-sqlite3": "^9.2.2",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## Step 3: Create Web Package.json

Create folder `web/` and file `web/package.json`.

### The Prompt

```
@workspace Create a package.json for a Next.js 14 app with:
- Name: afyapack-web
- Dependencies: next, react, react-dom, framer-motion, lucide-react
- Dev dependencies: tailwindcss, postcss, autoprefixer
- Scripts: dev, build, start, lint
- Use Next.js 14 with App Router
```

### Expected Output

```json
{
  "name": "afyapack-web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "framer-motion": "^10.16.16",
    "lucide-react": "^0.303.0",
    "next": "14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0"
  }
}
```

---

## Step 4: Create Folder Structure

Use Copilot to help create the initial folder structure.

### The Prompt

```
@workspace Create the folder structure for our API:
- src/index.js (Express entry point with basic setup)
- src/routes/ (folder for route modules)
- src/services/ (folder for business logic)
- src/db/ (folder for database)

Give me the minimal index.js that sets up Express with CORS and JSON parsing.
```

### Create api/src/index.js

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AfyaPack API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`[AfyaPack] API running at http://localhost:${PORT}`);
});
```

---

## Step 5: Create Web Structure

### The Prompt

```
@workspace Create a minimal Next.js 14 App Router setup:
- src/app/layout.js (root layout with metadata)
- src/app/page.js (simple home page)
- src/app/globals.css (import Tailwind)
- tailwind.config.js (content paths for src/app and src/components)
- next.config.js (basic config)
```

### Create web/src/app/layout.js

```javascript
import './globals.css';

export const metadata = {
  title: 'AfyaPack',
  description: 'Offline-first AI health decision support',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Create web/src/app/page.js

```javascript
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-emerald-600">AfyaPack</h1>
        <p className="text-gray-600 mt-2">Offline-first AI health decision support</p>
      </div>
    </main>
  );
}
```

### Create web/src/app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Create web/tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### Create web/postcss.config.js

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

## Step 6: Install Dependencies

```powershell
# From project root
npm run install:all
```

This will run:
1. `npm install` in root (gets concurrently)
2. `npm install` in api/ (gets Express, etc.)
3. `npm install` in web/ (gets Next.js, etc.)

**⏱️ This may take 2-3 minutes.**

---

## Step 7: Test the Scaffolding

### Start Both Servers

```powershell
npm run dev
```

You should see:
```
[API] [AfyaPack] API running at http://localhost:3001
[WEB] ▲ Next.js 14.0.4
[WEB] - Local: http://localhost:3000
```

### Verify API

```powershell
curl http://localhost:3001/api/health
```

Expected:
```json
{"status":"ok","message":"AfyaPack API is running"}
```

### Verify Web

Open http://localhost:3000 in your browser.

You should see:
- "AfyaPack" heading
- "Offline-first AI health decision support" subtext

**✓ Checkpoint:** Both servers are running and responding.

---

## Prompt Engineering Lesson

Notice how we approached scaffolding:

### Good Prompts

```
Create a package.json for a monorepo called "afyapack" with:
- Scripts to run both API and web simultaneously using concurrently
- A script to install all dependencies
- Version 1.0.0, private: true
```

### Weak Prompts

```
Make a package.json
```

### Why Good Prompts Work

| Aspect | Good | Weak |
|--------|------|------|
| **Task** | Specific action | Vague |
| **Context** | "monorepo", "afyapack" | None |
| **Requirements** | Listed explicitly | Missing |
| **Constraints** | "Version 1.0.0" | None |

**Remember:** Copilot is only as good as your prompt.

---

## Validation Checklist

Before proceeding to Lesson 04, verify:

- [ ] `package.json` exists in root
- [ ] `api/package.json` exists
- [ ] `web/package.json` exists
- [ ] `npm run install:all` completed successfully
- [ ] `npm run dev` starts both servers
- [ ] API health check returns JSON
- [ ] Web shows the AfyaPack page

---

## Troubleshooting

### "Cannot find module 'concurrently'"
```powershell
npm install  # in root folder
```

### "better-sqlite3 build error"
On Windows, you may need:
```powershell
npm install -g windows-build-tools
```

### Port already in use
```powershell
# Kill existing processes
taskkill /IM node.exe /F
npm run dev
```

---

## Stretch Goal

Try adding TypeScript to the web project:

```
@workspace Convert our Next.js project to TypeScript:
- Add typescript, @types/react, @types/node
- Convert page.js to page.tsx
- Add tsconfig.json
```

See if Copilot can guide you through the conversion.

---

## What You Learned

- How to scaffold a monorepo structure
- How to write effective Copilot prompts for file generation
- How to set up concurrent development scripts
- Basic Express.js and Next.js project structure

---

## Next Step

**Proceed to Lesson 04:** Backend API

You'll build the Express routes for encounters, guidance, and protocols.

---

*Scaffolding complete. Time to build the API. →*
