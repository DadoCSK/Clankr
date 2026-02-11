require('dotenv').config();
const express = require('express');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const agentsRouter = require('./routes/agents');
const matchRouter = require('./routes/match');
const sessionsRouter = require('./routes/sessions');

const app = express();

app.set('json spaces', 2);
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '50kb' }));
app.use(rateLimiter);

app.use('/agents', agentsRouter);
app.use('/match', matchRouter);
app.use('/sessions', sessionsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

module.exports = app;
