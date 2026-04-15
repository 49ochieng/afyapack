# Prompt: Express API Scaffold

## Description
Create a structured Express.js API server with middleware, error handling, and route organization.

---

## The Prompt

```
Create an Express.js API server with:
1. Main index.js entry point with middleware setup
2. CORS configured for local development
3. JSON body parsing
4. Request logging middleware
5. Health check endpoint
6. Error handling middleware
7. Graceful shutdown handling
8. Routes organized in separate files under routes/
9. Services organized under services/

Port should come from environment variable with fallback to 3001.
```

---

## Expected Output

### api/src/index.js
```javascript
import express from 'express';
import cors from 'cors';

// Route imports
import healthRoutes from './routes/health.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/health', healthRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

### api/src/routes/health.js
```javascript
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
```

### api/package.json
```json
{
  "name": "api",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.0"
  }
}
```

---

## Folder Structure

```
api/
├── package.json
├── src/
│   ├── index.js
│   ├── routes/
│   │   └── health.js
│   ├── services/
│   │   └── (services go here)
│   └── db/
│       └── (database modules go here)
```

---

## Variations

### With Rate Limiting
```
Add express-rate-limit middleware to the Express setup. Limit to 100 requests per minute per IP.
```

### With Request Validation
```
Add express-validator to validate incoming request bodies. Create a validation middleware factory.
```

### With OpenAPI/Swagger
```
Add swagger-ui-express and generate OpenAPI documentation for the API endpoints.
```
