import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app, csrfHeaders, loginAdmin, resetDatabase } from "../helpers.js";

const BASE = "/api/v1";

describe("Site settings API", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("public GET returns null defaults before configuration", async () => {
    const res = await request(app).get(`${BASE}/site-settings`);
    expect(res.status).toBe(200);
    expect(res.body.data.tagline).toBeNull();
    expect(res.body.data.seoTitle).toBeNull();
    expect(res.body.data.seoDescription).toBeNull();
  });

  it("admin PUT updates settings and returns 200", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.patch(`${BASE}/admin/site-settings`).set(csrfHeaders(csrfToken)).send({
      tagline: "Technology & Creative Studio",
      seoTitle: "Astrix Media",
      seoDescription: "Portfolio of Astrix Media",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.tagline).toBe("Technology & Creative Studio");
  });

  it("public GET reflects the saved settings", async () => {
    const res = await request(app).get(`${BASE}/site-settings`);
    expect(res.status).toBe(200);
    expect(res.body.data.seoTitle).toBe("Astrix Media");
  });

  it("admin PUT without CSRF returns 403", async () => {
    const { agent: a } = await loginAdmin();
    const res = await a.patch(`${BASE}/admin/site-settings`).send({ tagline: "no csrf" });
    expect(res.status).toBe(403);
  });

  it("settings PUT rejects oversized values with 400", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a
      .patch(`${BASE}/admin/site-settings`)
      .set(csrfHeaders(csrfToken))
      .send({ tagline: "x".repeat(400) });
    expect(res.status).toBe(400);
  });
});
