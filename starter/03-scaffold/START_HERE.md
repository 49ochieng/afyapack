# Starter: Project Scaffold

You're joining at Lesson 03. The basic project structure is ready.

## What's Included

```
afyapack/
├── package.json      ← Root workspace config
├── api/
│   └── package.json  ← Backend dependencies
└── web/
    └── package.json  ← Frontend dependencies
```

## Quick Setup

```bash
# Install all dependencies
npm install
cd api && npm install && cd ..
cd web && npm install && cd ..
```

## Continue From

**Lesson 04: Backend API**

You'll build:
- Express server
- SQLite database
- REST endpoints
- Health check route

## Verify Before Continuing

```bash
# From project root
npm run dev:api  # Should start on port 3001
```

Then proceed to Lesson 04.
