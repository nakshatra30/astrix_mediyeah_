import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app, csrfHeaders, loginAdmin, resetDatabase } from "../helpers.js";

const BASE = "/api/v1";

const servicePayload = {
  title: "Brand Identity",
  slug: "brand-identity",
  division: "CREATIVE",
  shortDescription: "Logo and identity systems",
  description: "<p>Full brand identity engagements.</p>",
  deliverables: ["Logo suite", "Brand book"],
  iconKey: "palette",
  displayOrder: 3,
  isActive: true,
};

describe("Services API", () => {
  let serviceId = "";

  beforeAll(async () => {
    await resetDatabase();
  });

  it("admin create returns 201 with data.id", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.post(`${BASE}/admin/services`).set(csrfHeaders(csrfToken)).send(servicePayload);
    expect(res.status).toBe(201);
    expect(res.body.data.id).toEqual(expect.any(String));
    expect(res.body.data.deliverables).toEqual(["Logo suite", "Brand book"]);
    serviceId = res.body.data.id;
  });

  it("create with a duplicate slug returns 409", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.post(`${BASE}/admin/services`).set(csrfHeaders(csrfToken)).send(servicePayload);
    expect(res.status).toBe(409);
  });

  it("public list returns only active services", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    await a.post(`${BASE}/admin/services`).set(csrfHeaders(csrfToken)).send({
      ...servicePayload,
      slug: "inactive-service",
      isActive: false,
    });

    const res = await request(app).get(`${BASE}/services?page=1&pageSize=50`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((s: { slug: string }) => s.slug === "brand-identity")).toBe(true);
    expect(res.body.data.some((s: { slug: string }) => s.slug === "inactive-service")).toBe(false);
  });

  it("public list filters by division", async () => {
    const res = await request(app).get(`${BASE}/services?division=TECHNOLOGY`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((s: { division: string }) => s.division === "TECHNOLOGY")).toBe(true);
  });

  it("public get by slug returns the active service; unknown and inactive slugs 404", async () => {
    const found = await request(app).get(`${BASE}/services/brand-identity`);
    expect(found.status).toBe(200);
    expect(found.body.data.slug).toBe("brand-identity");

    const unknown = await request(app).get(`${BASE}/services/does-not-exist`);
    expect(unknown.status).toBe(404);
    expect(unknown.body.error.code).toBe("NOT_FOUND");

    const inactive = await request(app).get(`${BASE}/services/inactive-service`);
    expect(inactive.status).toBe(404);
  });

  it("admin get by id returns 200", async () => {
    const { agent: a } = await loginAdmin();
    const res = await a.get(`${BASE}/admin/services/${serviceId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(serviceId);
  });

  it("admin update returns 200", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a
      .patch(`${BASE}/admin/services/${serviceId}`)
      .set(csrfHeaders(csrfToken))
      .send({ ...servicePayload, title: "Brand Identity Plus" });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Brand Identity Plus");
  });

  it("admin update accepts a partial payload (Bruno contract)", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a
      .patch(`${BASE}/admin/services/${serviceId}`)
      .set(csrfHeaders(csrfToken))
      .send({ title: "Bruno Test Service Updated", shortDescription: "Updated service summary.", isActive: true });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Bruno Test Service Updated");
    // Untouched fields keep their previous values.
    expect(res.body.data.division).toBe(servicePayload.division);
    expect(res.body.data.displayOrder).toBe(servicePayload.displayOrder);
  });

  it("admin deactivate (DELETE) returns 200 with data", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.delete(`${BASE}/admin/services/${serviceId}`).set(csrfHeaders(csrfToken));
    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it("deactivate an unknown id returns 404", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.delete(`${BASE}/admin/services/00000000-0000-4000-8000-000000000000`).set(csrfHeaders(csrfToken));
    expect(res.status).toBe(404);
  });
});
