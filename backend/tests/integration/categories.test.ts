import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app, csrfHeaders, loginAdmin, resetDatabase } from "../helpers.js";

const BASE = "/api/v1";

const categoryPayload = {
  name: "Creative Works",
  slug: "creative-works",
  division: "CREATIVE",
  description: "A category for creative projects",
  displayOrder: 2,
  isActive: true,
};

describe("Categories API", () => {
  let categoryId = "";

  beforeAll(async () => {
    await resetDatabase();
  });

  it("admin create returns 201 with data.id", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.post(`${BASE}/admin/categories`).set(csrfHeaders(csrfToken)).send(categoryPayload);
    expect(res.status).toBe(201);
    expect(res.body.data.id).toEqual(expect.any(String));
    expect(res.body.data.name).toBe(categoryPayload.name);
    categoryId = res.body.data.id;
  });

  it("create with a duplicate slug returns 409", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.post(`${BASE}/admin/categories`).set(csrfHeaders(csrfToken)).send(categoryPayload);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("create with an invalid division returns 400", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a
      .post(`${BASE}/admin/categories`)
      .set(csrfHeaders(csrfToken))
      .send({ ...categoryPayload, slug: "another-slug", division: "NOPE" });
    expect(res.status).toBe(400);
  });

  it("public list returns only active categories for the division", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    await a.post(`${BASE}/admin/categories`).set(csrfHeaders(csrfToken)).send({
      ...categoryPayload,
      slug: "inactive-category",
      isActive: false,
    });

    const res = await request(app).get(`${BASE}/categories?division=CREATIVE&page=1&pageSize=50`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((c: { slug: string }) => c.slug === "creative-works")).toBe(true);
    expect(res.body.data.some((c: { slug: string }) => c.slug === "inactive-category")).toBe(false);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it("admin update returns 200 with changes", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a
      .patch(`${BASE}/admin/categories/${categoryId}`)
      .set(csrfHeaders(csrfToken))
      .send({ ...categoryPayload, name: "Creative Works v2" });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Creative Works v2");
  });

  it("admin update accepts a partial payload (Bruno contract)", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a
      .patch(`${BASE}/admin/categories/${categoryId}`)
      .set(csrfHeaders(csrfToken))
      .send({ name: "Bruno Test Category Updated", description: "Updated category description.", displayOrder: 100 });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Bruno Test Category Updated");
    expect(res.body.data.displayOrder).toBe(100);
    // Untouched fields keep their previous values.
    expect(res.body.data.division).toBe("CREATIVE");
    expect(res.body.data.isActive).toBe(true);
  });

  it("admin deactivate (DELETE) returns 200 with data and hides it publicly", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.delete(`${BASE}/admin/categories/${categoryId}`).set(csrfHeaders(csrfToken));
    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
    expect(res.body.data.id).toBe(categoryId);

    const publicRes = await request(app).get(`${BASE}/categories?page=1&pageSize=50`);
    expect(publicRes.body.data.some((c: { id: string }) => c.id === categoryId)).toBe(false);
  });

  it("deactivate an unknown id returns 404", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.delete(`${BASE}/admin/categories/00000000-0000-4000-8000-000000000000`).set(csrfHeaders(csrfToken));
    expect(res.status).toBe(404);
  });
});
