import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` (run by `npm run build`) must not require a reachable
// database, so an unset DATABASE_URL falls back to a placeholder. Commands
// that actually connect (migrate, db push, seed) need the real value, which
// env.ts enforces when the server starts.
const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder";

const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx src/scripts/seed-dev.ts",
  },
  datasource: {
    url: databaseUrl,
    ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
  },
});
