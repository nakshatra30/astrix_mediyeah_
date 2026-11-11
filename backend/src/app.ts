import fs from "node:fs";
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
// Built React app (created by `npm run build` in frontend/ during deploy).
const frontendDistDir = path.resolve(backendRoot, "..", "frontend", "dist");
const servesSpa = env.isProduction && fs.existsSync(frontendDistDir);

export function createApp(): express.Express {
  const app = express();

  // Hide implementation details.
  app.disable("x-powered-by");
  // Behind one proxy hop in production; direct connections in dev/test.
  app.set("trust proxy", env.isProduction ? 1 : false);

  // Security headers. Strict CSP for a JSON API in development; in
  // production this service also serves the built SPA, so its own assets,
  // Google Fonts and Cloudinary-hosted media are allowed.
  app.use(
    helmet({
      contentSecurityPolicy: servesSpa
        ? {
            useDefaults: false,
            directives: {
              "default-src": ["'self'"],
              "script-src": ["'self'"],
              "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
              "font-src": ["'self'", "https://fonts.gstatic.com"],
              "img-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
              "connect-src": ["'self'"],
              "object-src": ["'none'"],
              "frame-ancestors": ["'none'"],
              "base-uri": ["'self'"],
              "form-action": ["'self'"],
            },
          }
        : {
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

  // CORS: credentials enabled for cookies. Same-origin SPA requests (the
  // browser sends Origin on POSTs) are accepted by matching the request's
  // own host, so a slightly wrong CLIENT_URL cannot lock out the admin.
  // In development the common Vite dev/preview hosts are allowed too.
  const devOrigins = [
    env.clientUrl,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
  ];
  app.use(
    cors((req, callback) => {
      const origin = req.headers.origin;
      const sameOrigin =
        servesSpa &&
        origin !== undefined &&
        req.headers.host !== undefined &&
        origin === `https://${req.headers.host}`;
      const allowed =
        origin === undefined ||
        sameOrigin ||
        (env.isProduction ? origin === env.clientUrl : devOrigins.includes(origin));
      callback(null, {
        origin: allowed,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "X-CSRF-Token", "X-Request-Id"],
        maxAge: 600,
      });
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

  // Production SPA: static assets first, then index.html for client-side
  // routes. API paths keep their JSON 404 responses.
  if (servesSpa) {
    app.use(express.static(frontendDistDir, { index: false, maxAge: "1h", redirect: false }));
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api/")) {
        next();
        return;
      }
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(path.join(frontendDistDir, "index.html"), (err) => {
        if (err !== undefined) next(err);
      });
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
