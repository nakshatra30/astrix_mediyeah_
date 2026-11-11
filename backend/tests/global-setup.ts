import { execSync } from "node:child_process";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function setup(): Promise<void> {
  config({ path: path.resolve(backendRoot, ".env") });

  const testDatabaseUrl = process.env.TEST_DATABASE_URL;
  if (testDatabaseUrl === undefined || testDatabaseUrl.trim() === "") {
    throw new Error("TEST_DATABASE_URL must be set (see backend/.env.example). Never point it at dev/prod.");
  }

  // Apply committed migrations to the test database before any test file runs.
  execSync("npx prisma migrate deploy", {
    cwd: backendRoot,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  });

  console.log("[global-setup] test database schema applied");
}
