import "dotenv/config";
import type { Express } from "express";

let app: Express;
let disconnect: (() => Promise<void>) | undefined;

try {
  const [{ createApp }, { prisma }] = await Promise.all([
    import("./app.js"),
    import("./config/prisma.js"),
  ]);
  disconnect = () => prisma.$disconnect();
  app = createApp();
} catch (err) {
  const detail = err instanceof Error ? (err.stack ?? err.message) : String(err);
  console.error("[astrix-media-api] boot failure:", detail);
  const express = (await import("express")).default;
  const diag = express();
  diag.disable("x-powered-by");
  diag.use((_req, res) => {
    res.status(500).json({
      error: {
        code: "SERVER_BOOT_ERROR",
        message: err instanceof Error ? err.message : String(err),
      },
    });
  });
  app = diag;
}

if (process.env.VERCEL !== "1") {
  const parsedPort = Number.parseInt(process.env.PORT ?? "5000", 10);
  const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 5000;
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`[astrix-media-api] listening on http://0.0.0.0:${port}`);
  });

  function shutdown(signal: string): void {
    console.log(`\n[astrix-media-api] ${signal} received — shutting down gracefully`);
    server.close(() => {
      if (disconnect === undefined) {
        process.exit(0);
        return;
      }
      disconnect()
        .then(() => process.exit(0))
        .catch(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

export default app;

