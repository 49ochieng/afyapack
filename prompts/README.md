# AfyaPack Copilot Prompts Library

> Ready-to-use prompts for building healthcare AI applications.

This directory contains categorized GitHub Copilot prompts extracted from the lab lessons. Use these in your own projects.

---

## Organization

```
prompts/
├── setup/           # Project scaffolding prompts
├── backend/         # Express, database, API prompts
├── frontend/        # React, Next.js UI prompts
├── ai-integration/  # Foundry, LLM, RAG prompts
├── safety/          # Red flags, validation prompts
└── polish/          # Animations, i18n, UX prompts
```

---

## Quick Reference

### Scaffolding
- [01-project-setup.md](setup/01-project-setup.md) - Initialize monorepo
- [02-express-scaffold.md](setup/02-express-scaffold.md) - Create API server
- [03-nextjs-scaffold.md](setup/03-nextjs-scaffold.md) - Create web app

### Backend
- [01-sqlite-module.md](backend/01-sqlite-module.md) - Database setup
- [02-rest-routes.md](backend/02-rest-routes.md) - CRUD endpoints
- [03-retrieval-service.md](backend/03-retrieval-service.md) - TF-IDF search

### AI Integration
- [01-foundry-client.md](ai-integration/01-foundry-client.md) - LLM connection
- [02-system-prompts.md](ai-integration/02-system-prompts.md) - Prompt templates
- [03-grounded-rag.md](ai-integration/03-grounded-rag.md) - RAG implementation

### Frontend
- [01-chat-components.md](frontend/01-chat-components.md) - Chat UI
- [02-form-patterns.md](frontend/02-form-patterns.md) - Multi-step forms
- [03-state-management.md](frontend/03-state-management.md) - React Context

### Safety
- [01-red-flag-rules.md](safety/01-red-flag-rules.md) - Safety engine
- [02-validation.md](safety/02-validation.md) - Input validation

### Polish
- [01-animations.md](polish/01-animations.md) - Framer Motion
- [02-i18n.md](polish/02-i18n.md) - Internationalization

---

## Usage Tips

1. **In VS Code Chat**: Copy the prompt, paste into Copilot Chat
2. **Inline Comments**: Add prompts as comments for inline suggestions
3. **Customize**: Replace placeholders like `[DOMAIN]` with your specifics

---

## Contributing

When adding new prompts:
1. Use consistent format (see existing files)
2. Include "Expected Copilot Response" section
3. Note any dependencies
4. Test before committing
