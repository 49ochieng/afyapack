const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDB } = require('./db/index');
const { seedDatabase } = require('./db/seed');
const { initFoundry } = require('./services/foundry');

const healthRouter = require('./routes/health');
const protocolsRouter = require('./routes/protocols');
const encountersRouter = require('./routes/encounters');
const guidanceRouter = require('./routes/guidance');
const referralsRouter = require('./routes/referrals');
const stockRouter = require('./routes/stock');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

const ALLOWED_ORIGINS = [
  WEB_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  // Allow any Vercel deployment (preview + production)
  /\.vercel\.app$/,
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // server-to-server / curl
    const allowed = ALLOWED_ORIGINS.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    cb(null, allowed);
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/health', healthRouter);
app.use('/api/protocols', protocolsRouter);
app.use('/api/encounters', encountersRouter);
app.use('/api/guidance', guidanceRouter);
app.use('/api/referrals', referralsRouter);
app.use('/api/stock', stockRouter);
app.use('/api/chat', chatRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[Error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  try {
    console.log('[AfyaPack] Starting API server...');
    await initDB();
    await seedDatabase();
    await initFoundry();

    app.listen(PORT, () => {
      console.log(`[AfyaPack] API running at http://localhost:${PORT}`);
      console.log(`[AfyaPack] Web expected at ${WEB_URL}`);
    });
  } catch (err) {
    console.error('[AfyaPack] Startup failed:', err);
    process.exit(1);
  }
}

start();
