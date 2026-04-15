# Final Code Reference

The complete, production-ready AfyaPack application exists in the main project folders. This document serves as a map to the final implementation.

## Code Location

The existing `api/` and `web/` folders at the root of this repository contain the complete, working implementation of AfyaPack. These are NOT starter files - they are the finished product.

## Architecture Overview

```
AfyaPack/
├── api/                    ← COMPLETE BACKEND
│   ├── src/
│   │   ├── index.js       # Express server entry point
│   │   ├── db/
│   │   │   ├── index.js   # SQLite database module
│   │   │   └── seed.js    # Protocol seeding script
│   │   ├── routes/
│   │   │   ├── chat.js    # Chat API endpoint
│   │   │   ├── encounters.js
│   │   │   ├── guidance.js
│   │   │   ├── health.js
│   │   │   ├── protocols.js
│   │   │   ├── referrals.js
│   │   │   └── stock.js
│   │   └── services/
│   │       ├── foundry.js  # LLM integration
│   │       ├── prompts.js  # System prompts
│   │       └── retrieval.js # TF-IDF search
│   └── package.json
│
├── web/                    ← COMPLETE FRONTEND
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.js
│   │   │   ├── page.js      # Home/dashboard
│   │   │   ├── globals.css
│   │   │   ├── chat/page.js
│   │   │   ├── encounter/page.js
│   │   │   ├── guidance/[id]/page.js
│   │   │   ├── stock/page.js
│   │   │   └── settings/page.js
│   │   ├── components/
│   │   │   ├── chat/        # Chat components
│   │   │   ├── layout/      # App shell, nav
│   │   │   └── ui/          # Base components
│   │   ├── hooks/
│   │   │   └── useOfflineStatus.js
│   │   └── lib/
│   │       ├── api.js       # API client
│   │       ├── db.js        # Client-side storage
│   │       ├── redflags.js  # Safety rules
│   │       └── utils.js
│   └── package.json
│
└── mcp/                    ← MCP SERVER (optional)
    └── src/
        └── index.js
```

## Key Files by Feature

### Chat System
- `api/src/routes/chat.js` - Chat API
- `api/src/services/foundry.js` - LLM integration
- `api/src/services/retrieval.js` - RAG pipeline
- `web/src/app/chat/page.js` - Chat UI
- `web/src/components/chat/*` - Chat components

### Patient Encounters
- `api/src/routes/encounters.js` - Encounter CRUD
- `api/src/routes/guidance.js` - AI guidance
- `web/src/app/encounter/page.js` - Intake form
- `web/src/components/EncounterForm.jsx`

### Safety System
- `api/src/services/redflags.js` - Server-side rules
- `web/src/lib/redflags.js` - Client-side rules
- `web/src/components/RedFlagBanner.jsx`

### Stock Management
- `api/src/routes/stock.js` - Stock API
- `web/src/app/stock/page.js` - Stock UI

### Internationalization
- `web/src/lib/i18n/*` - Translations
- `web/src/components/LanguageSwitcher.jsx`

## Running the Final App

```bash
# From project root
npm install
cd api && npm install && npm run seed && cd ..
cd web && npm install && cd ..

# Start Foundry Local first (via AI Toolkit)

# Then start the app
npm run dev

# Open http://localhost:3000
```

## Database

SQLite database at `api/data/afyapack.db` with tables:
- `encounters` - Patient encounters
- `protocol_chunks` - Protocol text chunks (for retrieval)
- `guidance` - Generated guidance records
- `referrals` - Referral documents
- `stock_items` - Medicine inventory

## Environment Variables

### api/.env
```
PORT=3001
FOUNDRY_URL=http://127.0.0.1:54346/v1
DATABASE_PATH=./data/afyapack.db
```

### web/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Version Info

- Node.js: v18+
- Next.js: 14.x
- Express: 4.x
- SQLite: via better-sqlite3
- LLM: Qwen 2.5 0.5B (via Foundry Local)
