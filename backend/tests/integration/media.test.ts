import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/config/prisma.js";
import { PNG_BUFFER, app, csrfHeaders, loginAdmin, resetDatabase, validProjectPayload } from "../helpers.js";

const BASE = "/api/v1";

describe("Media assets API", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("upload requires a session (401 without cookie)", async () => {
    const res = await request(app)
      .post(`${BASE}/admin/media`)
      .attach("file", PNG_BUFFER, { filename: "tiny.png", contentType: "image/png" });
    expect(res.status).toBe(401);
  });

  it("upload a valid PNG returns 201 with image metadata", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a
      .post(`${BASE}/admin/media`)
      .set(csrfHeaders(csrfToken))
      .attach("file", PNG_BUFFER, { filename: "tiny.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toEqual(expect.any(String));
    expect(res.body.data.mimeType).toBe("image/png");
    expect(res.body.data.width).toBe(1);
    expect(res.body.data.height).toBe(1);
    expect(res.body.data.byteSize).toBe(PNG_BUFFER.byteLength);
    expect(res.body.data.url).toContain("/uploads/");
  });

  it("upload a non-image buffer returns 415 (magic-byte sniffing)", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a
      .post(`${BASE}/admin/media`)
      .set(csrfHeaders(csrfToken))
      .attach("file", Buffer.from("this is definitely not an image, just text"), {
        filename: "evil.png",
        contentType: "image/png",
      });
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("upload a spoofed extension with HTML content returns 415", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a
      .post(`${BASE}/admin/media`)
      .set(csrfHeaders(csrfToken))
      .attach("file", Buffer.from("<html><body><script>alert(1)</script></body></html>"), {
        filename: "fake.jpg",
        contentType: "image/jpeg",
      });
    expect(res.status).toBe(415);
  });

  it("upload without the file field returns 400", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a.post(`${BASE}/admin/media`).set(csrfHeaders(csrfToken)).field("other", "value");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("upload larger than 5MB returns 413", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const res = await a
      .post(`${BASE}/admin/media`)
      .set(csrfHeaders(csrfToken))
      .attach("file", Buffer.concat([PNG_BUFFER, Buffer.alloc(6 * 1024 * 1024)]), {
        filename: "huge.png",
        contentType: "image/png",
      });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("admin list returns uploaded assets with pagination", async () => {
    const { agent: a } = await loginAdmin();
    const res = await a.get(`${BASE}/admin/media?page=1&pageSize=10`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it("delete a referenced asset returns 409 (project image)", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const upload = await a
      .post(`${BASE}/admin/media`)
      .set(csrfHeaders(csrfToken))
      .attach("file", PNG_BUFFER, { filename: "referenced.png", contentType: "image/png" });
    const assetId = upload.body.data.id as string;

    const category = await a.post(`${BASE}/admin/categories`).set(csrfHeaders(csrfToken)).send({
      name: "Media Cat",
      slug: "media-cat",
      division: "TECHNOLOGY",
    });
    const project = await a.post(`${BASE}/admin/projects`).set(csrfHeaders(csrfToken)).send({
      ...validProjectPayload(category.body.data.id),
      slug: "media-project",
    });
    await prisma.projectImage.create({
      data: { projectId: project.body.data.id, mediaAssetId: assetId, altText: "ref", displayOrder: 0 },
    });

    const res = await a.delete(`${BASE}/admin/media/${assetId}`).set(csrfHeaders(csrfToken));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");

    // Cleanup so later tests start clean.
    await prisma.projectImage.deleteMany({});
  });

  it("delete an unreferenced asset returns 200 with data; then 404", async () => {
    const { agent: a, csrfToken } = await loginAdmin();
    const upload = await a
      .post(`${BASE}/admin/media`)
      .set(csrfHeaders(csrfToken))
      .attach("file", PNG_BUFFER, { filename: "deleteme.png", contentType: "image/png" });
    const assetId = upload.body.data.id as string;

    const res = await a.delete(`${BASE}/admin/media/${assetId}`).set(csrfHeaders(csrfToken));
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(assetId);

    const again = await a.delete(`${BASE}/admin/media/${assetId}`).set(csrfHeaders(csrfToken));
    expect(again.status).toBe(404);
  });
});
