import "dotenv/config";
import express from "express";

// TEMPORARY DIAGNOSTIC (DIAG-BOOT-v1): surface the real boot error instead of
// Vercel's opaque FUNCTION_INVOCATION_FAILED. Reverts once the root cause is
// fixed. The app graph is imported dynamically so a module-load failure
// (env vars, prisma adapter, bcrypt bindings) is caught and reported.

const DIAG_MARKER = "DIAG-BOOT-v1";

function bootPort(): number {
  const parsed = Number.parseInt(process.env.PORT ?? "5000", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
}

async function main(): Promise<void> {
  let app: express.Express;
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
    console.error(`[${DIAG_MARKER}] boot failure:\n${detail}`);
    const diag = express();
    diag.disable("x-powered-by");
    diag.use((_req, res) => {
      res.status(500).type("text/plain").send(`${DIAG_MARKER}\n\n${detail}`);
    });
    app = diag;
  }

  const server = app.listen(bootPort(), "0.0.0.0", () => {
    console.log(
      `[astrix-media-api] listening on http://0.0.0.0:${bootPort()}${disconnect === undefined ? ` (${DIAG_MARKER} degraded mode)` : ""}`,
    );
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
    // Force-exit if connections do not drain in time.
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err: unknown) => {
  console.error(`[${DIAG_MARKER}] unhandled boot error:`, err);
  process.exit(1);
});
