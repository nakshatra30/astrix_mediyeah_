import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

const app = createApp();

const server = app.listen(env.port, "0.0.0.0", () => {
  console.log(`[astrix-media-api] ${env.nodeEnv} — listening on http://0.0.0.0:${env.port}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`\n[astrix-media-api] ${signal} received — shutting down gracefully`);
  server.close(() => {
    prisma
      .$disconnect()
      .then(() => process.exit(0))
      .catch(() => process.exit(0));
  });
  // Force-exit if connections do not drain in time.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
