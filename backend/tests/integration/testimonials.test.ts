import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app, csrfHeaders, loginAdmin, resetDatabase } from "../helpers.js";

const BASE = "/api/v1";

const testimonialPayload = {
  clientName: "Jane Client",
  designation: "Head of Product",
  companyName: "Acme Corp",
  quote: "<p>Outstanding delivery — <b>on time</b> and beyond scope.</p>",
  rating: 5,
  isPublished: true,
  displayOrder: 1,
};

describe("Testimonials API", () => {
  let testimonialId = "";

  beforeAll(async () => {
    await resetDatabase();
  });

  it("admin create returns 201 with data.id", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.post(`${BASE}/admin/testimonials`).set(csrfHeaders(csrfToken)).send(testimonialPayload);
    expect(res.status).toBe(201);
    expect(res.body.data.id).toEqual(expect.any(String));
    expect(res.body.data.rating).toBe(5);
    testimonialId = res.body.data.id;
  });

  it("create sanitizes the quote (XSS)", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.post(`${BASE}/admin/testimonials`).set(csrfHeaders(csrfToken)).send({
      ...testimonialPayload,
      quote: '<p>Great</p><script>alert(1)</script>',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.quote).not.toContain("<script");
  });

  it("create rejects an out-of-range rating with 400", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.post(`${BASE}/admin/testimonials`).set(csrfHeaders(csrfToken)).send({
      ...testimonialPayload,
      rating: 9,
    });
    expect(res.status).toBe(400);
  });

  it("public list returns only published testimonials", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    await a.post(`${BASE}/admin/testimonials`).set(csrfHeaders(csrfToken)).send({
      ...testimonialPayload,
      isPublished: false,
    });

    const res = await request(app).get(`${BASE}/testimonials?page=1&pageSize=50`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((t: { isPublished: boolean }) => t.isPublished)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it("admin update returns 200", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a
      .patch(`${BASE}/admin/testimonials/${testimonialId}`)
      .set(csrfHeaders(csrfToken))
      .send({ ...testimonialPayload, clientName: "Jane Client II" });
    expect(res.status).toBe(200);
    expect(res.body.data.clientName).toBe("Jane Client II");
  });

  it("admin update accepts a partial payload (Bruno contract)", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a
      .patch(`${BASE}/admin/testimonials/${testimonialId}`)
      .set(csrfHeaders(csrfToken))
      .send({ quote: "Updated testimonial feedback for Bruno CRUD testing.", rating: 4, isPublished: false });
    expect(res.status).toBe(200);
    expect(res.body.data.rating).toBe(4);
    expect(res.body.data.isPublished).toBe(false);
    // Untouched fields keep their previous values.
    expect(res.body.data.clientName).toBe("Jane Client II");
  });

  it("admin delete returns 200 with the deleted data; then 404", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.delete(`${BASE}/admin/testimonials/${testimonialId}`).set(csrfHeaders(csrfToken));
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(testimonialId);

    const again = await a.delete(`${BASE}/admin/testimonials/${testimonialId}`).set(csrfHeaders(csrfToken));
    expect(again.status).toBe(404);
  });

  it("delete an unknown id returns 404", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.delete(`${BASE}/admin/testimonials/00000000-0000-4000-8000-000000000000`).set(csrfHeaders(csrfToken));
    expect(res.status).toBe(404);
  });
});
