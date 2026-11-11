import { createApp } from "../../backend/src/app.js";

/**
 * Vercel serverless entrypoint: every /api/v1/* request is handled by the
 * same Express app that server.ts runs elsewhere. Non-API paths are served
 * by the platform instead (static SPA files plus rewrites).
 *
 * The app is created once per container and reused across warm invocations;
 * sessions live in Postgres, so any instance can serve any request.
 */
const app = createApp();

export default app;
