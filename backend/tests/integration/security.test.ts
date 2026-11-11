import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { TEST_ADMIN, app, ensureTestAdmin, resetDatabase } from "../helpers.js";

const BASE = "/api/v1";

describe("Security headers & platform behavior", () => {
  beforeAll(async () => {
    await resetDatabase();
    await ensureTestAdmin();
  });

  it("hides the X-Powered-By header", async () => {
    const res = await request(app).get(`${BASE}/health`);
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("sets strict security headers on every response", async () => {
    const res = await request(app).get(`${BASE}/health`);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
    expect(res.headers["content-security-policy"]).toContain("default-src 'none'");
    expect(res.headers["referrer-policy"]).toBe("no-referrer");
    expect(res.headers["cross-origin-resource-policy"]).toBe("cross-origin");
    // HSTS is production-only.
    expect(res.headers["strict-transport-security"]).toBeUndefined();
  });

  it("answers CORS preflight only for the allowed origin", async () => {
    const allowed = await request(app)
      .options(`${BASE}/health`)
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "GET");
    expect(allowed.status).toBeLessThan(400);
    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(allowed.headers["access-control-allow-credentials"]).toBe("true");

    const denied = await request(app)
      .options(`${BASE}/health`)
      .set("Origin", "https://evil.example.com")
      .set("Access-Control-Request-Method", "GET");
    expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("does not emit CORS headers for a disallowed origin on normal requests", async () => {
    const res = await request(app).get(`${BASE}/health`).set("Origin", "https://evil.example.com");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("malformed JSON returns 400 with the error envelope", async () => {
    const res = await request(app)
      .post(`${BASE}/auth/login`)
      .set("Content-Type", "application/json")
      .send('{"email": "broken",');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.requestId).toEqual(expect.any(String));
  });

  it("unknown routes return the 404 envelope with a matching X-Request-Id", async () => {
    const res = await request(app).get(`${BASE}/nope/nothing`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.requestId).toBe(res.headers["x-request-id"]);
  });

  it("echoes a client-supplied X-Request-Id when safe", async () => {
    const res = await request(app).get(`${BASE}/health`).set("X-Request-Id", "trace-123");
    expect(res.headers["x-request-id"]).toBe("trace-123");
  });

  it("sanitizes a malicious X-Request-Id instead of echoing it", async () => {
    const res = await request(app).get(`${BASE}/health`).set("X-Request-Id", "bad id with spaces!");
    expect(res.headers["x-request-id"]).not.toContain("\n");
    expect(res.headers["x-request-id"]).toMatch(/^[A-Za-z0-9._-]{1,64}$/);
  });

  it("rate-limit headers are present on limited endpoints", async () => {
    const res = await request(app).post(`${BASE}/auth/login`).send({
      email: TEST_ADMIN.email,
      password: "definitely-wrong",
    });
    expect(res.status).toBe(401);
    expect(res.headers["ratelimit-policy"]).toBeDefined();
  });

  it("serves uploaded images without auth (public static content)", async () => {
    const res = await request(app).get("/uploads/definitely-missing-file.png");
    expect(res.status).toBe(404); // fallthrough to the API 404 envelope
    expect(res.body.error).toBeDefined();
  });
});
