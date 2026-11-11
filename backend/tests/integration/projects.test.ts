import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/config/prisma.js";
import { app, csrfHeaders, loginAdmin, resetDatabase, validProjectPayload } from "../helpers.js";

const BASE = "/api/v1";

async function createCategory(): Promise<{ id: string; slug: string }> {
  const { agent: a, csrfToken } = await loginAdmin();
  const res = await a.post(`${BASE}/admin/categories`).set(csrfHeaders(csrfToken)).send({
    name: "Projects Category",
    slug: "projects-category",
    division: "TECHNOLOGY",
    displayOrder: 1,
    isActive: true,
  });
  return { id: res.body.data.id as string, slug: res.body.data.slug as string };
}

describe("Projects API", () => {
  let categoryId = "";
  let projectId = "";
  let projectSlug = "";

  beforeAll(async () => {
    await resetDatabase();
    const created = await createCategory();
    categoryId = created.id;
  });

  it("admin create returns 201 with data.id and data.slug", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.post(`${BASE}/admin/projects`).set(csrfHeaders(csrfToken)).send({
      ...validProjectPayload(categoryId),
      slug: "bruno-project-alpha",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toEqual(expect.any(String));
    expect(res.body.data.slug).toBe("bruno-project-alpha");
    expect(res.body.data.status).toBe("PUBLISHED");
    expect(res.body.data.category.id).toBe(categoryId);
    expect(res.body.data.technologies).toEqual(["TypeScript", "Express"]);

    projectId = res.body.data.id;
    projectSlug = res.body.data.slug;
  });

  it("create with a duplicate slug returns 409 CONFLICT", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.post(`${BASE}/admin/projects`).set(csrfHeaders(csrfToken)).send({
      ...validProjectPayload(categoryId),
      slug: "bruno-project-alpha",
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("create with an invalid payload returns 400 with details", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a
      .post(`${BASE}/admin/projects`)
      .set(csrfHeaders(csrfToken))
      .send({ ...validProjectPayload(categoryId), title: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it("create with an unknown categoryId returns 400", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.post(`${BASE}/admin/projects`).set(csrfHeaders(csrfToken)).send({
      ...validProjectPayload("00000000-0000-4000-8000-000000000000"),
      slug: "orphan-project",
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("create sanitizes stored rich text (XSS)", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a
      .post(`${BASE}/admin/projects`)
      .set(csrfHeaders(csrfToken))
      .send({
        ...validProjectPayload(categoryId),
        slug: "xss-project",
        fullDescription: '<p>ok</p><script>alert("xss")</script><img src=x onerror=alert(1)>',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.fullDescription).not.toContain("<script");
    expect(res.body.data.fullDescription).not.toContain("onerror");
    expect(res.body.data.fullDescription).toContain("<p>ok</p>");
  });

  it("admin list paginates and filters by status", async () => {
    const { agent: a } = await loginAdmin();
    const res = await a.get(`${BASE}/admin/projects?page=1&pageSize=10&sort=newest`);
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
    expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(1);

    const drafts = await a.get(`${BASE}/admin/projects?status=DRAFT`);
    expect(drafts.body.data.every((p: { status: string }) => p.status === "DRAFT")).toBe(true);
  });

  it("public list returns only PUBLISHED projects with meta", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    await a.post(`${BASE}/admin/projects`).set(csrfHeaders(csrfToken)).send({
      ...validProjectPayload(categoryId),
      slug: "draft-project",
      status: "DRAFT",
    });

    const res = await request(app).get(`${BASE}/projects?division=TECHNOLOGY&sort=newest&page=1&pageSize=50`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.every((p: { status: string }) => p.status === "PUBLISHED")).toBe(true);
    expect(res.body.meta.page).toBe(1);
  });

  it("public get by slug returns the published project; unknown/draft slugs 404", async () => {
    const found = await request(app).get(`${BASE}/projects/${projectSlug}`);
    expect(found.status).toBe(200);
    expect(found.body.data.slug).toBe(projectSlug);

    const unknown = await request(app).get(`${BASE}/projects/does-not-exist`);
    expect(unknown.status).toBe(404);
    expect(unknown.body.error.code).toBe("NOT_FOUND");

    const draft = await request(app).get(`${BASE}/projects/draft-project`);
    expect(draft.status).toBe(404);
  });

  it("admin get by id returns 200; random UUID returns 404", async () => {
    const { agent: a } = await loginAdmin();
    const found = await a.get(`${BASE}/admin/projects/${projectId}`);
    expect(found.status).toBe(200);
    expect(found.body.data.id).toBe(projectId);

    const missing = await a.get(`${BASE}/admin/projects/00000000-0000-4000-8000-000000000000`);
    expect(missing.status).toBe(404);
  });

  it("admin update changes fields and returns 200", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a
      .patch(`${BASE}/admin/projects/${projectId}`)
      .set(csrfHeaders(csrfToken))
      .send({ ...validProjectPayload(categoryId), slug: projectSlug, title: "Updated Title" });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Updated Title");
  });

  it("admin update accepts a partial payload (Bruno contract) and leaves other fields intact", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a
      .patch(`${BASE}/admin/projects/${projectId}`)
      .set(csrfHeaders(csrfToken))
      .send({ title: "Bruno Test Project Updated", shortDescription: "Updated description from Bruno.", isFeatured: true });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Bruno Test Project Updated");
    expect(res.body.data.shortDescription).toBe("Updated description from Bruno.");
    expect(res.body.data.isFeatured).toBe(true);
    // Untouched fields keep their previous values.
    expect(res.body.data.slug).toBe(projectSlug);
    expect(res.body.data.division).toBe("TECHNOLOGY");
  });

  it("admin archive (DELETE) returns 200 with archived data; project leaves the public list", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.delete(`${BASE}/admin/projects/${projectId}`).set(csrfHeaders(csrfToken));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ARCHIVED");
    expect(res.body.data.id).toBe(projectId);

    const publicRes = await request(app).get(`${BASE}/projects/${projectSlug}`);
    expect(publicRes.status).toBe(404);
  });

  it("pagination caps pageSize at 50 (overfetch guard)", async () => {
    const res = await request(app).get(`${BASE}/projects?pageSize=500`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("archive of an unknown id returns 404", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.delete(`${BASE}/admin/projects/00000000-0000-4000-8000-000000000000`).set(csrfHeaders(csrfToken));
    expect(res.status).toBe(404);
  });

  it("invalid UUID path parameter returns 400", async () => {
    const { agent: a } = await loginAdmin();
    const res = await a.get(`${BASE}/admin/projects/not-a-uuid`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("archived project still appears in the admin list with status filter", async () => {
    const { agent: a } = await loginAdmin();
    const res = await a.get(`${BASE}/admin/projects?status=ARCHIVED`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((p: { id: string }) => p.id === projectId)).toBe(true);
    await expect(prisma.project.count()).resolves.toBeGreaterThan(0);
  });
});
