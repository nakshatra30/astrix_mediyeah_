import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app, csrfHeaders, loginAdmin, resetDatabase } from "../helpers.js";

const BASE = "/api/v1";

async function createActiveService(): Promise<string> {
  const { agent: a, csrfToken } = await loginAdmin();
  const res = await a.post(`${BASE}/admin/services`).set(csrfHeaders(csrfToken)).send({
    title: "Website Development",
    slug: "website-development",
    division: "TECHNOLOGY",
    shortDescription: "Websites",
    description: "<p>Websites.</p>",
    deliverables: ["Build"],
    iconKey: "code",
    displayOrder: 1,
    isActive: true,
  });
  return res.body.data.id as string;
}

const enquiryPayload = (serviceId: string | null) => ({
  name: "Prospective Client",
  email: "PROSPECT@Example.COM",
  phone: "+91 98765 43210",
  company: "Example Inc",
  serviceId,
  serviceNameSnapshot: "Website Development",
  budgetRange: "50k-1L INR",
  projectDescription: "We need a marketing site with a blog and contact form.",
  privacyConsent: true,
  sourcePage: "/contact",
});

describe("Enquiries API", () => {
  let serviceId = "";
  let enquiryId = "";

  beforeAll(async () => {
    await resetDatabase();
    serviceId = await createActiveService();
  });

  it("public create returns 201 with data.id (with serviceId)", async () => {
    const res = await request(app).post(`${BASE}/enquiries`).send(enquiryPayload(serviceId));
    expect(res.status).toBe(201);
    expect(res.body.data.id).toEqual(expect.any(String));
    expect(res.body.data.status).toBe("NEW");
    expect(res.body.data.email).toBe("prospect@example.com"); // normalized
    expect(res.body.data.service.id).toBe(serviceId);
    enquiryId = res.body.data.id;
  });

  it("public create without a serviceId still works (snapshot only)", async () => {
    const res = await request(app).post(`${BASE}/enquiries`).send({
      ...enquiryPayload(null),
      email: "other@example.com",
      serviceId: null,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.serviceId).toBeNull();
  });

  it("public create with privacyConsent=false returns 400", async () => {
    const res = await request(app).post(`${BASE}/enquiries`).send({
      ...enquiryPayload(serviceId),
      email: "no-consent@example.com",
      privacyConsent: false,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("public create with an unknown serviceId returns 400", async () => {
    const res = await request(app)
      .post(`${BASE}/enquiries`)
      .send({ ...enquiryPayload("00000000-0000-4000-8000-000000000000"), email: "ghost@example.com" });
    expect(res.status).toBe(400);
  });

  it("public create sanitizes the project description (XSS)", async () => {
    const res = await request(app).post(`${BASE}/enquiries`).send({
      ...enquiryPayload(serviceId),
      email: "xss@example.com",
      projectDescription: 'Legit description here<script>alert(1)</script><p onclick="x()">still here</p>',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.projectDescription).not.toContain("<script");
    expect(res.body.data.projectDescription).not.toContain("onclick");
  });

  it("admin list supports status=NEW filter and pagination", async () => {
    const { agent: a } = await loginAdmin();
    const res = await a.get(`${BASE}/admin/enquiries?status=NEW&page=1&pageSize=10`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((e: { status: string }) => e.status === "NEW")).toBe(true);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
  });

  it("admin get by id returns the enquiry", async () => {
    const { agent: a } = await loginAdmin();
    const res = await a.get(`${BASE}/admin/enquiries/${enquiryId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(enquiryId);
    expect(Array.isArray(res.body.data.notes)).toBe(true);
  });

  it("admin PATCH status updates to IN_PROGRESS", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.patch(`${BASE}/admin/enquiries/${enquiryId}`).set(csrfHeaders(csrfToken)).send({ status: "IN_PROGRESS" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("IN_PROGRESS");
  });

  it("admin PATCH with an invalid status returns 400", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.patch(`${BASE}/admin/enquiries/${enquiryId}`).set(csrfHeaders(csrfToken)).send({ status: "WAT" });
    expect(res.status).toBe(400);
  });

  it("admin adds a note (201) and lists notes", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const create = await a.post(`${BASE}/admin/enquiries/${enquiryId}/notes`).set(csrfHeaders(csrfToken)).send({
      body: "<p>Called the client — <b>positive</b>.</p><script>bad()</script>",
    });
    expect(create.status).toBe(201);
    expect(create.body.data.id).toEqual(expect.any(String));
    expect(create.body.data.body).not.toContain("<script");

    const list = await a.get(`${BASE}/admin/enquiries/${enquiryId}/notes`);
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("enquiry has no delete endpoint by design (404)", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.delete(`${BASE}/admin/enquiries/${enquiryId}`).set(csrfHeaders(csrfToken));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("admin enquiry routes require a session (401)", async () => {
    const res = await request(app).get(`${BASE}/admin/enquiries`);
    expect(res.status).toBe(401);
  });
});
