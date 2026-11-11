import bcrypt from "bcrypt";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";

export const app = createApp();

export const TEST_ADMIN = {
  name: "Test Admin",
  email: "admin@test.local",
  password: "CorrectHorse!42",
};

export type Agent = ReturnType<typeof request.agent>;

export function agent(): Agent {
  return request.agent(app);
}

export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "admin_sessions", "admin_users", "enquiry_notes", "enquiries", "project_images", "projects", "categories", "services", "testimonials", "media_assets", "site_settings" RESTART IDENTITY CASCADE',
  );
}

export async function ensureTestAdmin(password: string = TEST_ADMIN.password): Promise<{ id: string; email: string; password: string }> {
  const existing = await prisma.adminUser.findUnique({ where: { email: TEST_ADMIN.email } });
  const user =
    existing !== null
      ? existing
      : await prisma.adminUser.create({
          data: { name: TEST_ADMIN.name, email: TEST_ADMIN.email, passwordHash: await bcrypt.hash(password, 4) },
        });
  return { id: user.id, email: TEST_ADMIN.email, password };
}

export interface LoggedInAdmin {
  agent: Agent;
  csrfToken: string;
  admin: { id: string; email: string; password: string };
}

export async function loginAdmin(password: string = TEST_ADMIN.password): Promise<LoggedInAdmin> {
  const admin = await ensureTestAdmin(password);
  const a = agent();
  const loginRes = await a.post("/api/v1/auth/login").send({ email: admin.email, password });
  if (loginRes.status !== 200) {
    throw new Error(`Test admin login failed: ${loginRes.status} ${JSON.stringify(loginRes.body)}`);
  }
  const meRes = await a.get("/api/v1/auth/me");
  const csrfToken: string = meRes.body.data.csrfToken;
  return { agent: a, csrfToken, admin };
}

export function csrfHeaders(csrfToken: string): Record<string, string> {
  return { "X-CSRF-Token": csrfToken };
}

export const PNG_BUFFER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

export const validProjectPayload = (categoryId: string | null) => ({
  title: "Test Project",
  slug: "test-project",
  division: "TECHNOLOGY",
  categoryId,
  shortDescription: "A short description",
  fullDescription: "<p>Full <b>description</b></p>",
  challenge: "<p>Challenge</p>",
  solution: "<p>Solution</p>",
  process: "<p>Process</p>",
  technologies: ["TypeScript", "Express"],
  projectUrl: "https://example.com",
  repositoryUrl: "https://github.com/example/repo",
  isFeatured: false,
  status: "PUBLISHED",
});
