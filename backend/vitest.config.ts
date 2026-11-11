import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["tests/setup.ts"],
    globalSetup: ["tests/global-setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Test files share one physical database; run them sequentially, each in
    // an isolated worker process (fresh in-memory state, fresh rate limiter).
    fileParallelism: false,
    pool: "forks",
  },
});
