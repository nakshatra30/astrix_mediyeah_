import bcrypt from "bcrypt";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/config/prisma.js";
import { TEST_ADMIN, agent, app, ensureTestAdmin, loginAdmin, resetDatabase } from "../helpers.js";

const BASE = "/api/v1";

describe("Admin auth", () => {
  beforeAll(async () => {
    await resetDatabase();
    await ensureTestAdmin();
  });

  it("login returns the admin envelope and sets an HttpOnly session cookie", async () => {
    const res = await request(app).post(`${BASE}/auth/login`).send({
      email: TEST_ADMIN.email,
      password: TEST_ADMIN.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(TEST_ADMIN.email);
    expect(res.body.data.id).toEqual(expect.any(String));

    const setCookie = res.headers["set-cookie"];
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join(";") : String(setCookie);
    expect(cookieHeader).toContain("HttpOnly");
    expect(cookieHeader).toContain("astrix.sid=");
  });

  it("login with a wrong password returns 401 INVALID_CREDENTIALS", async () => {
    const res = await request(app).post(`${BASE}/auth/login`).send({
      email: TEST_ADMIN.email,
      password: "wrong-password-1",
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("login with an unknown email returns the same 401 as a wrong password (no user enumeration)", async () => {
    const res = await request(app).post(`${BASE}/auth/login`).send({
      email: "ghost@nowhere.tld",
      password: "whatever-password",
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(res.body.error.message).toBe("Invalid email or password");
  });

  it("login with a malformed body returns 400 VALIDATION_ERROR", async () => {
    const res = await request(app).post(`${BASE}/auth/login`).send({ email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it("me returns the session csrfToken and admin profile", async () => {
    const { agent: a } = await loginAdmin();
    const res = await a.get(`${BASE}/auth/me`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(TEST_ADMIN.email);
    expect(res.body.data.csrfToken).toEqual(expect.any(String));
  });

  it("me without a session returns 401 UNAUTHENTICATED (Bruno negative test)", async () => {
    const res = await request(app).get(`${BASE}/auth/me`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("admin routes without a session return 401 (Bruno negative test: GET /admin/projects)", async () => {
    const res = await request(app).get(`${BASE}/admin/projects`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("logout with CSRF returns 204 and clears the cookie", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.post(`${BASE}/auth/logout`).set("X-CSRF-Token", csrfToken).send();
    expect(res.status).toBe(204);
    expect(res.text ?? "").toBe("");

    const me = await a.get(`${BASE}/auth/me`);
    expect(me.status).toBe(401);
  });

  it("logout without CSRF returns 403", async () => {
    const { agent: a } = await loginAdmin();
    const res = await a.post(`${BASE}/auth/logout`).send();
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("state-changing admin requests without CSRF return 403", async () => {
    const { agent: a } = await loginAdmin();
    const res = await a.post(`${BASE}/admin/categories`).send({ name: "x", slug: "x", division: "TECHNOLOGY" });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("state-changing admin requests with a wrong CSRF token return 403", async () => {
    const { agent: a } = await loginAdmin();
    const res = await a.post(`${BASE}/admin/categories`).set("X-CSRF-Token", "deadbeef").send({
      name: "x",
      slug: "x",
      division: "TECHNOLOGY",
    });
    expect(res.status).toBe(403);
  });

  it("change-password updates the password, revokes other sessions, and forces re-login", async () => {
    const first = await loginAdmin();
    const second = await loginAdmin(); // second device/session

    const res = await first.agent
      .post(`${BASE}/auth/change-password`)
      .set("X-CSRF-Token", first.csrfToken)
      .send({ currentPassword: TEST_ADMIN.password, newPassword: "BrandNewPass!99" });
    expect(res.status).toBe(200);

    // The other session must be revoked.
    const secondMe = await second.agent.get(`${BASE}/auth/me`);
    expect(secondMe.status).toBe(401);

    // Old password no longer works; new one does.
    const oldLogin = await request(app)
      .post(`${BASE}/auth/login`)
      .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });
    expect(oldLogin.status).toBe(401);

    const newLogin = await agent().post(`${BASE}/auth/login`).send({ email: TEST_ADMIN.email, password: "BrandNewPass!99" });
    expect(newLogin.status).toBe(200);

    // Restore the original password for other tests in this file.
    await prisma.adminUser.update({
      where: { email: TEST_ADMIN.email },
      data: { passwordHash: await bcrypt.hash(TEST_ADMIN.password, 4) },
    });
  });

  it("change-password with a wrong current password returns 401", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a
      .post(`${BASE}/auth/change-password`)
      .set("X-CSRF-Token", csrfToken)
      .send({ currentPassword: "not-the-password", newPassword: "BrandNewPass!99" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("change-password rejects a weak new password with 400", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a
      .post(`${BASE}/auth/change-password`)
      .set("X-CSRF-Token", csrfToken)
      .send({ currentPassword: TEST_ADMIN.password, newPassword: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
