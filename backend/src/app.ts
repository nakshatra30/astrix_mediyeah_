import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestId } from "./middleware/requestId.js";
import { globalLimiter } from "./middleware/rateLimiters.js";
import { apiRouter } from "./routes/index.js";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uploadsDir = path.join(backendRoot, "uploads");

export function createApp(): express.Express {
  const app = express();

  // Hide implementation details.
  app.disable("x-powered-by");
  // Behind one proxy hop in production; direct connections in dev/test.
  app.set("trust proxy", env.isProduction ? 1 : false);

  // Security headers. Strict CSP for a JSON API (no inline content, no frames).
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          "default-src": ["'none'"],
          "frame-ancestors": ["'none'"],
          "base-uri": ["'none'"],
          "form-action": ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: "cross-origin" }, // uploaded images may be embedded cross-origin
      referrerPolicy: { policy: "no-referrer" },
      crossOriginEmbedderPolicy: false,
      hsts: env.isProduction ? {} : false,
    }),
  );

  // CORS: only the configured frontend origin, credentials enabled for cookies.
  app.use(
    cors({
      origin: [env.clientUrl],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "X-CSRF-Token", "X-Request-Id"],
      maxAge: 600,
    }),
  );

  app.use(requestId);
  app.use(globalLimiter);
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // Local-disk media fallback (development). Read-only static serving.
  app.use(
    "/uploads",
    express.static(uploadsDir, { fallthrough: true, maxAge: "1d", index: false, redirect: false }),
  );

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
