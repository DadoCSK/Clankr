require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const agentsRouter = require('./routes/agents');
const matchRouter = require('./routes/match');
const sessionsRouter = require('./routes/sessions');
const viewerRouter = require('./routes/viewer');
const socialRouter = require('./routes/social');
const paymentRouter = require('./routes/payment');

const app = express();

app.set('json spaces', 2);

// ── Security headers ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);

  // Content Security Policy — block inline scripts, restrict sources
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Don't leak referrer to third parties
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Disable browser features we don't need
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
});

app.use(express.json({ limit: '50kb' }));
app.use(rateLimiter);

app.use('/agents', agentsRouter);
app.use('/match', matchRouter);
app.use('/sessions', sessionsRouter);
app.use('/viewer', viewerRouter);
app.use('/social', socialRouter);
app.use('/payment', paymentRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const agentManualPath = path.join(__dirname, '..', 'AGENTS_MANUAL.json');
app.get('/.well-known/agent-manual.json', (req, res, next) => {
  fs.readFile(agentManualPath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return res.status(404).json({ error: 'Agent manual not found' });
      return next(err);
    }
    try {
      const manual = JSON.parse(data);
      res.setHeader('Content-Type', 'application/json');
      res.json(manual);
    } catch (parseErr) {
      next(parseErr);
    }
  });
});

app.use(errorHandler);

module.exports = app;
