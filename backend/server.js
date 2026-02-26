'use strict';

require('dotenv').config();

const { testConnection } = require('./src/config/db');
const app                = require('./src/app');
const logger             = require('./src/utils/logger.util');

const PORT = parseInt(process.env.PORT || '5000', 10);

async function bootstrap() {
  // Test DB before accepting traffic
  await testConnection();

  const server = app.listen(PORT, () => {
    logger.info('═'.repeat(55));
    logger.info('  🚀  WA AI Backend started');
    logger.info(`  📡  Port      : ${PORT}`);
    logger.info(`  🌍  Env       : ${process.env.NODE_ENV || 'development'}`);
    logger.info(`  🔗  API base  : http://localhost:${PORT}/api`);
    logger.info(`  ❤️   Health    : http://localhost:${PORT}/health`);
    logger.info('═'.repeat(55));
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  function shutdown(signal) {
    logger.info(`[Server] ${signal} received — shutting down gracefully…`);
    server.close(() => {
      logger.info('[Server] HTTP server closed.');
      process.exit(0);
    });
    // Force exit after 10 s
    setTimeout(() => process.exit(1), 10_000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('[Server] Unhandled Rejection:', String(reason));
    shutdown('unhandledRejection');
  });

  process.on('uncaughtException', (err) => {
    logger.error('[Server] Uncaught Exception:', err.message);
    shutdown('uncaughtException');
  });
}

bootstrap();
