require('dotenv').config();

const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// ── Boot ─────────────────────────────────────────────────────────────────────
async function boot() {
  const expressApp = require('./app');
  const db = require('./db');
  const backgroundMatchService = require('./services/backgroundMatchService');

  let httpServer;

  if (isProduction) {
    // ── Production: unified server (Express API + Next.js dashboard) ─────────
    const next = require('next');
    const { parse } = require('url');
    const path = require('path');

    const nextApp = next({
      dev: false,
      dir: path.join(__dirname, '..', 'dashboard'),
    });
    const handle = nextApp.getRequestHandler();

    await nextApp.prepare();
    console.log('[server] Next.js dashboard ready');

    // Route requests: API paths → Express, everything else → Next.js
    const API_PREFIXES = [
      '/agents', '/sessions', '/match', '/viewer',
      '/social', '/payment', '/health', '/.well-known',
    ];

    const { createServer } = require('http');

    httpServer = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      const isApi = API_PREFIXES.some((p) => parsedUrl.pathname.startsWith(p));

      if (isApi) {
        expressApp(req, res);
      } else {
        handle(req, res, parsedUrl);
      }
    });

    httpServer.listen(PORT, () => {
      console.log(`[server] Production server on port ${PORT}`);
      backgroundMatchService.startBackgroundMatching();
    });
  } else {
    // ── Development: Express only (Next.js runs separately via `npm run dev:dashboard`) ──
    httpServer = expressApp.listen(PORT, () => {
      console.log(`[server] Dev API server on port ${PORT}`);
      backgroundMatchService.startBackgroundMatching();
    });
  }

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[server] ${signal} received — shutting down gracefully…`);

    backgroundMatchService.stopBackgroundMatching();

    httpServer.close(() => {
      console.log('[server] HTTP server closed');
    });

    try {
      await db.pool.end();
      console.log('[server] Database pool drained');
    } catch (err) {
      console.error('[server] Error draining DB pool:', err.message);
    }

    // Force exit after 10s if something hangs
    setTimeout(() => {
      console.error('[server] Forced exit after timeout');
      process.exit(1);
    }, 10_000).unref();

    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    console.error('[server] Unhandled rejection:', reason);
  });
}

boot().catch((err) => {
  console.error('[server] Fatal boot error:', err);
  process.exit(1);
});
