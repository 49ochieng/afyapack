# Prompt: Project Setup

## Description
Initialize a monorepo structure for a full-stack application with API and web packages.

---

## The Prompt

```
Create a monorepo structure for a health application with:
1. Root package.json with workspaces for api/ and web/
2. api/ folder with Express.js backend
3. web/ folder with Next.js 14 frontend
4. Shared scripts in root for running both
5. Environment variable templates (.env.example files)
6. .gitignore for Node.js projects

Use npm workspaces. Include start scripts for development.
```

---

## Expected Output

### Root package.json
```json
{
  "name": "afyapack",
  "private": true,
  "workspaces": ["api", "web"],
  "scripts": {
    "dev": "concurrently \"npm run dev:api\" \"npm run dev:web\"",
    "dev:api": "npm run dev -w api",
    "dev:web": "npm run dev -w web",
    "build": "npm run build -w api && npm run build -w web",
    "start": "npm run start -w api"
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
```

### .gitignore
```
node_modules/
.env
.env.local
*.log
.DS_Store
.next/
dist/
*.db
```

### api/.env.example
```
PORT=3001
FOUNDRY_URL=http://127.0.0.1:54346/v1
OLLAMA_URL=http://127.0.0.1:11434/v1
DATABASE_PATH=./data/afyapack.db
```

### web/.env.example
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Variations

### Minimal Setup
```
Create a basic project structure with api/ and web/ folders. Just the folder structure and package.json files, no code yet.
```

### With TypeScript
```
Create a TypeScript monorepo with api/ (Express + ts-node) and web/ (Next.js with TypeScript). Include tsconfig.json files.
```

### With Docker
```
Create a monorepo structure that includes Dockerfiles for both api and web, plus a docker-compose.yml for local development.
```

---

## Usage

Run after creating an empty project folder:
```bash
mkdir afyapack && cd afyapack
# Use prompts with Copilot to scaffold
```
