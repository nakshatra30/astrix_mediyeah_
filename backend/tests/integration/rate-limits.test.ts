import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { TEST_ADMIN, app, ensureTestAdmin, resetDatabase } from "../helpers.js";

const BASE = "/api/v1";

/**
 * Rate limiting tests live in their own file: the in-memory limiter store is
 * per-process, and vitest runs each file in an isolated worker, so triggering
 * the limits here cannot poison other test files.
 */
describe("Rate limiting", () => {
  beforeAll(async () => {
    await resetDatabase();
    await ensureTestAdmin();
  });

  it("locks out after 10 failed logins (11th returns 429)", async () => {
    for (let i = 0; i < 10; i += 1) {
      const res = await request(app).post(`${BASE}/auth/login`).send({
        email: TEST_ADMIN.email,
        password: `wrong-attempt-${i}`,
      });
      expect(res.status).toBe(401);
    }

    const blocked = await request(app).post(`${BASE}/auth/login`).send({
      email: TEST_ADMIN.email,
      password: "another-wrong-attempt",
    });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");
    expect(blocked.headers["retry-after"]).toBeDefined();
  });

  it("still counts failed logins for a different email from the same IP", async () => {
    const res = await request(app).post(`${BASE}/auth/login`).send({
      email: "someone-else@example.com",
      password: "wrong",
    });
    expect(res.status).toBe(429);
  });

  it("blocks the public enquiry form after repeated invalid submissions", async () => {
    const payload = {
      name: "Rate Limit Probe",
      email: "probe@example.com",
      projectDescription: "Triggering the enquiry rate limit with invalid payloads.",
      privacyConsent: false, // invalid -> counts toward the limit
    };
    let lastStatus = 0;
    for (let i = 0; i < 12; i += 1) {
      const res = await request(app).post(`${BASE}/enquiries`).send(payload);
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
    expect([400, 429]).toContain(lastStatus);
  });
});
