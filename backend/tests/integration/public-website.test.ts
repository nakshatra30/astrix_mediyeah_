import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app, csrfHeaders, loginAdmin, resetDatabase, type LoggedInAdmin } from "../helpers.js";
import { prisma } from "../../src/config/prisma.js";

const BASE = "/api/v1";
const PUBLIC = `${BASE}/public`;

let admin: LoggedInAdmin;
let categoryId: string;
let activeServiceId: string;
let inactiveServiceId: string;

async function seedFixtures(): Promise<void> {
  const category = await prisma.category.create({
    data: { name: "Web Apps", slug: "web-apps", division: "TECHNOLOGY", isActive: true, displayOrder: 1 },
  });
  categoryId = category.id;

  const activeService = await prisma.service.create({
    data: {
      title: "Business Website Development",
      slug: "business-website-development",
      division: "TECHNOLOGY",
      shortDescription: "Websites for growing businesses",
      deliverables: ["Design", "Build", "Launch"],
      iconKey: "code",
      isActive: true,
      displayOrder: 1,
    },
  });
  activeServiceId = activeService.id;

  const inactiveService = await prisma.service.create({
    data: {
      title: "Inactive Service",
      slug: "inactive-service",
      division: "CREATIVE",
      isActive: false,
      displayOrder: 9,
    },
  });
  inactiveServiceId = inactiveService.id;

  await prisma.project.createMany({
    data: [
      {
        title: "Published Featured Project",
        slug: "published-featured-project",
        division: "TECHNOLOGY",
        categoryId,
        shortDescription: "A featured published project",
        technologies: ["TypeScript", "Express"],
        isFeatured: true,
        status: "PUBLISHED",
      },
      {
        title: "Published Plain Project",
        slug: "published-plain-project",
        division: "CREATIVE",
        shortDescription: "A plain published project",
        isFeatured: false,
        status: "PUBLISHED",
      },
      {
        title: "Secret Draft Project",
        slug: "secret-draft-project",
        division: "TECHNOLOGY",
        shortDescription: "Never visible publicly",
        status: "DRAFT",
      },
    ],
  });

  await prisma.testimonial.createMany({
    data: [
      {
        clientName: "Happy Client",
        designation: "CEO",
        companyName: "Happy Corp",
        quote: "Great work",
        rating: 5,
        isPublished: true,
        displayOrder: 1,
      },
      {
        clientName: "Hidden Client",
        quote: "Not approved yet",
        isPublished: false,
        displayOrder: 2,
      },
    ],
  });

  const settingsValues = {
    agencyName: "Astrix Media",
    tagline: "Technology & Creative Studio",
    heroTitle: "We build digital experiences",
    heroSubtitle: "Marketing and technology under one roof",
    contactEmail: "hello@astrixmedia.in",
    contactPhone: "+919876543210",
    whatsappNumber: "+919876543210",
    socialInstagram: "https://instagram.com/astrixmedia",
    seoTitle: "Astrix Media",
  };
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: settingsValues,
    create: { id: "singleton", ...settingsValues },
  });
}

describe("Public website API", () => {
  beforeAll(async () => {
    await resetDatabase();
    await seedFixtures();
    admin = await loginAdmin();
  });

  describe("GET /public/home", () => {
    it("returns the aggregated homepage payload", async () => {
      const res = await request(app).get(`${PUBLIC}/home`);
      expect(res.status).toBe(200);
      const { data } = res.body;
      expect(data.agency.name).toBe("Astrix Media");
      expect(data.agency.tagline).toBe("Technology & Creative Studio");
      expect(data.hero.title).toBe("We build digital experiences");
      expect(data.about.intro).toBeNull();
      expect(data.contact).toMatchObject({ email: "hello@astrixmedia.in", phone: "+919876543210", whatsapp: "+919876543210" });
      expect(data.social.instagram).toBe("https://instagram.com/astrixmedia");
      expect(data.seo.title).toBe("Astrix Media");
    });

    it("only surfaces active services, published featured projects and approved testimonials", async () => {
      const res = await request(app).get(`${PUBLIC}/home`);
      const { data } = res.body;
      expect(data.services.featured.every((s: { isActive?: boolean }) => s.isActive === undefined || s.isActive === true)).toBe(true);
      expect(data.services.featured.some((s: { slug: string }) => s.slug === "inactive-service")).toBe(false);
      expect(data.projects.featured.every((p: { status: string; isFeatured: boolean }) => p.status === "PUBLISHED" && p.isFeatured === true)).toBe(true);
      expect(data.projects.featured.some((p: { slug: string }) => p.slug === "secret-draft-project")).toBe(false);
      expect(data.testimonials.approved.every((t: { isPublished?: boolean }) => t.isPublished === undefined || t.isPublished === true)).toBe(true);
      expect(data.testimonials.approved.some((t: { clientName: string }) => t.clientName === "Hidden Client")).toBe(false);
    });
  });

  describe("GET /public/services", () => {
    it("lists only active services with pagination meta", async () => {
      const res = await request(app).get(`${PUBLIC}/services`);
      expect(res.status).toBe(200);
      expect(res.body.data.every((s: { isActive: boolean }) => s.isActive === true)).toBe(true);
      expect(res.body.data.some((s: { id: string }) => s.id === inactiveServiceId)).toBe(false);
      expect(res.body.meta).toMatchObject({ page: 1, pageSize: 10, total: 1, totalPages: 1 });
    });

    it("filters by division", async () => {
      const res = await request(app).get(`${PUBLIC}/services?division=CREATIVE`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0); // the only CREATIVE service is inactive
      const res2 = await request(app).get(`${PUBLIC}/services?division=TECHNOLOGY`);
      expect(res2.body.data.every((s: { division: string }) => s.division === "TECHNOLOGY")).toBe(true);
    });

    it("rejects an invalid division with 400", async () => {
      const res = await request(app).get(`${PUBLIC}/services?division=NOPE`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /public/services/:slug", () => {
    it("returns an active service by slug", async () => {
      const res = await request(app).get(`${PUBLIC}/services/business-website-development`);
      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe("business-website-development");
      expect(res.body.data.deliverables).toEqual(["Design", "Build", "Launch"]);
    });

    it("hides inactive services with 404", async () => {
      const res = await request(app).get(`${PUBLIC}/services/inactive-service`);
      expect(res.status).toBe(404);
    });

    it("rejects malformed slugs with 400", async () => {
      const res = await request(app).get(`${PUBLIC}/services/Not_A_Slug`);
      expect(res.status).toBe(400);
    });
  });

  describe("GET /public/projects", () => {
    it("lists only published projects with pagination meta", async () => {
      const res = await request(app).get(`${PUBLIC}/projects`);
      expect(res.status).toBe(200);
      expect(res.body.data.every((p: { status: string }) => p.status === "PUBLISHED")).toBe(true);
      expect(res.body.data.some((p: { slug: string }) => p.slug === "secret-draft-project")).toBe(false);
      expect(res.body.meta.total).toBe(2);
    });

    it("filters by featured=true", async () => {
      const res = await request(app).get(`${PUBLIC}/projects?featured=true`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].slug).toBe("published-featured-project");
    });

    it("filters by category slug", async () => {
      const res = await request(app).get(`${PUBLIC}/projects?category=web-apps`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].category.slug).toBe("web-apps");
    });

    it("searches by title case-insensitively", async () => {
      const res = await request(app).get(`${PUBLIC}/projects?search=FEATURED`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].slug).toBe("published-featured-project");
    });

    it("returns empty meta for a search with no matches", async () => {
      const res = await request(app).get(`${PUBLIC}/projects?search=zzzznothing`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.meta).toMatchObject({ total: 0, totalPages: 0 });
    });

    it("returns a published project by slug with gallery array", async () => {
      const res = await request(app).get(`${PUBLIC}/projects/published-featured-project`);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("PUBLISHED");
      expect(Array.isArray(res.body.data.images)).toBe(true);
      expect(res.body.data.technologies).toEqual(["TypeScript", "Express"]);
    });

    it("hides draft projects with 404", async () => {
      const res = await request(app).get(`${PUBLIC}/projects/secret-draft-project`);
      expect(res.status).toBe(404);
    });
  });

  describe("GET /public/testimonials", () => {
    it("lists only published testimonials", async () => {
      const res = await request(app).get(`${PUBLIC}/testimonials`);
      expect(res.status).toBe(200);
      expect(res.body.data.every((t: { isPublished: boolean }) => t.isPublished === true)).toBe(true);
      expect(res.body.data.some((t: { clientName: string }) => t.clientName === "Hidden Client")).toBe(false);
    });
  });

  describe("GET /public/site-settings", () => {
    it("returns public business information only", async () => {
      const res = await request(app).get(`${PUBLIC}/site-settings`);
      expect(res.status).toBe(200);
      expect(res.body.data.agencyName).toBe("Astrix Media");
      expect(res.body.data.contactEmail).toBe("hello@astrixmedia.in");
      expect(res.body.data.socialInstagram).toBe("https://instagram.com/astrixmedia");
      expect(res.body.data).not.toHaveProperty("passwordHash");
      expect(JSON.stringify(res.body.data)).not.toContain("admin");
    });
  });

  describe("POST /public/enquiries", () => {
    const validPayload = {
      name: "Walk-in Visitor",
      email: "visitor@example.com",
      phone: "+919876543210",
      company: "Visitor Biz",
      serviceId: null as string | null,
      serviceNameSnapshot: "Business Website Development",
      budgetRange: "50000-100000",
      preferredContactMethod: "WHATSAPP",
      projectDescription: "We need a portfolio website for our business.",
      privacyConsent: true,
      sourcePage: "/contact",
    };

    it("stores an enquiry with NEW status and it appears in the admin dashboard", async () => {
      const res = await request(app).post(`${PUBLIC}/enquiries`).send({ ...validPayload, serviceId: activeServiceId });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("NEW");
      expect(res.body.data.preferredContactMethod).toBe("WHATSAPP");
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.createdAt).toBeDefined();

      const adminList = await admin.agent.get(`${BASE}/admin/enquiries`);
      expect(adminList.status).toBe(200);
      expect(adminList.body.data.some((e: { id: string }) => e.id === res.body.data.id)).toBe(true);
    });

    it("accepts an enquiry without phone, company or service linkage", async () => {
      const res = await request(app).post(`${PUBLIC}/enquiries`).send({
        name: "Minimal Visitor",
        email: "minimal@example.com",
        projectDescription: "General question about your services.",
        privacyConsent: true,
      });
      expect(res.status).toBe(201);
      expect(res.body.data.service).toBeNull();
      expect(res.body.data.phone).toBeNull();
    });

    it("rejects a nonexistent serviceId with 400", async () => {
      const res = await request(app).post(`${PUBLIC}/enquiries`).send({
        ...validPayload,
        serviceId: "00000000-0000-0000-0000-000000000000",
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("validates required fields, formats and consent", async () => {
      const cases = [
        { ...validPayload, name: "A" }, // too short
        { ...validPayload, email: "not-an-email" }, // bad email
        { ...validPayload, phone: "call-me" }, // bad phone
        { ...validPayload, projectDescription: "too short" }, // too short description
        { ...validPayload, privacyConsent: false }, // no consent
        { ...validPayload, preferredContactMethod: "FAX" }, // unsupported method
      ];
      for (const payload of cases) {
        const res = await request(app).post(`${PUBLIC}/enquiries`).send(payload);
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
        expect(Array.isArray(res.body.error.details)).toBe(true);
      }
    });

    it("rejects an unknown field in the payload", async () => {
      const res = await request(app).post(`${PUBLIC}/enquiries`).send({ ...validPayload, isAdmin: true });
      expect(res.status).toBe(400);
    });
  });

  describe("Admin workflow bridges (public content comes from admin data)", () => {
    it("workflow 1: admin creates a service, public API serves it", async () => {
      const createRes = await admin.agent
        .post(`${BASE}/admin/services`)
        .set(csrfHeaders(admin.csrfToken))
        .send({
          title: "SEO Service",
          slug: "seo-service",
          division: "CREATIVE",
          shortDescription: "Search engine optimisation",
          isActive: true,
        });
      expect(createRes.status).toBe(201);

      const publicRes = await request(app).get(`${PUBLIC}/services/seo-service`);
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.data.title).toBe("SEO Service");
    });

    it("workflow 2: admin creates and publishes a project, public portfolio displays it", async () => {
      const createRes = await admin.agent
        .post(`${BASE}/admin/projects`)
        .set(csrfHeaders(admin.csrfToken))
        .send({
          title: "Workflow Two Project",
          slug: "workflow-two-project",
          division: "TECHNOLOGY",
          categoryId,
          shortDescription: "Created then published",
          status: "PUBLISHED",
          isFeatured: true,
        });
      expect(createRes.status).toBe(201);

      const publicRes = await request(app).get(`${PUBLIC}/projects/workflow-two-project`);
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.data.status).toBe("PUBLISHED");
    });

    it("workflow 3: enquiry submitted by a visitor is visible to the admin", async () => {
      const submit = await request(app).post(`${PUBLIC}/enquiries`).send({
        name: "Workflow Three",
        email: "w3@example.com",
        serviceId: activeServiceId,
        projectDescription: "Please contact me about branding.",
        privacyConsent: true,
      });
      expect(submit.status).toBe(201);

      const detail = await admin.agent.get(`${BASE}/admin/enquiries/${submit.body.data.id}`);
      expect(detail.status).toBe(200);
      expect(detail.body.data.status).toBe("NEW");
      expect(detail.body.data.service.slug).toBe("business-website-development");
    });

    it("workflow 4: admin updates enquiry status and sees the new status", async () => {
      const submit = await request(app).post(`${PUBLIC}/enquiries`).send({
        name: "Workflow Four",
        email: "w4@example.com",
        projectDescription: "Status transition test enquiry.",
        privacyConsent: true,
      });
      expect(submit.status).toBe(201);
      const id = submit.body.data.id;

      const update = await admin.agent
        .patch(`${BASE}/admin/enquiries/${id}`)
        .set(csrfHeaders(admin.csrfToken))
        .send({ status: "IN_PROGRESS" });
      expect(update.status).toBe(200);
      expect(update.body.data.status).toBe("IN_PROGRESS");

      const detail = await admin.agent.get(`${BASE}/admin/enquiries/${id}`);
      expect(detail.body.data.status).toBe("IN_PROGRESS");
    });

    it("workflow 5: admin publishes a testimonial, public API displays it", async () => {
      const createRes = await admin.agent
        .post(`${BASE}/admin/testimonials`)
        .set(csrfHeaders(admin.csrfToken))
        .send({
          clientName: "Workflow Five Client",
          quote: "Published via admin",
          isPublished: true,
        });
      expect(createRes.status).toBe(201);

      const publicRes = await request(app).get(`${PUBLIC}/testimonials`);
      expect(publicRes.body.data.some((t: { clientName: string }) => t.clientName === "Workflow Five Client")).toBe(true);
    });
  });

  describe("Backwards compatibility", () => {
    it("keeps serving the original public paths", async () => {
      for (const path of ["/services", "/projects", "/testimonials", "/site-settings"]) {
        const res = await request(app).get(`${BASE}${path}`);
        expect(res.status).toBe(200);
      }
    });
  });
});
