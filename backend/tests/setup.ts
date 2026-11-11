import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
config({ path: path.resolve(backendRoot, ".env") });

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl === undefined || testDatabaseUrl.trim() === "") {
  throw new Error("TEST_DATABASE_URL must be set (see backend/.env.example). Never point it at dev/prod.");
}

// Point the app at the isolated test database BEFORE any src module loads.
process.env.DATABASE_URL = testDatabaseUrl;
process.env.NODE_ENV = "test";
process.env.BCRYPT_ROUNDS = "4"; // keep auth tests fast; tests hash their own fixtures
