# Starter: Backend Complete

You're joining at Lesson 06. The backend API is fully working.

## What's Included

- ✅ Express server with all routes
- ✅ SQLite database with schema
- ✅ Foundry Local integration
- ✅ Protocol retrieval (TF-IDF)
- ✅ Red flag detection service
- ❌ Frontend (you'll build this)

## Quick Setup

```bash
npm install
cd api && npm install && cd ..
cd web && npm install && cd ..

# Seed the database
cd api && npm run seed && cd ..
```

## Verify Backend

```bash
# Start API
npm run dev:api

# Test health endpoint
curl http://localhost:3001/health

# Test chat (requires Foundry Local running)
curl -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hello"}]}'
```

## Continue From

**Lesson 06: Chat Experience**

You'll build:
- Chat UI components
- Message display
- Input composer
- Real-time responses

Then proceed to Lesson 06.
