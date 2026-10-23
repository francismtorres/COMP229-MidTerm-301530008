import 'dotenv/config';
import type { Server } from 'node:http';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import connectDB from './config/db.js';
import { loadEnv } from './config/env.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function start(): Promise<void> {
  const env = loadEnv();

  await connectDB();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`[server] Listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  registerShutdownHandlers(server);
}

function registerShutdownHandlers(server: Server): void {
  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[server] ${signal} received, shutting down gracefully`);

    const forceExit = setTimeout(() => {
      console.error('[server] Forced shutdown after timeout');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      await mongoose.disconnect();
      console.log('[server] Shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('[server] Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('[server] Unhandled promise rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('[server] Uncaught exception:', err);
    void shutdown('uncaughtException');
  });
}

start().catch((err: Error) => {
  console.error('[server] Failed to start:', err.message);
  process.exit(1);
});
