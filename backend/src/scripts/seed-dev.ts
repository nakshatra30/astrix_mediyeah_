/**
 * Development seed data for the Bruno collection flow.
 * - Idempotent: everything is upserted by a stable slug/key.
 * - Marked with "[TEST DATA]" so it is easy to identify.
 * - NEVER creates admin users (use `npm run admin:create`).
 * - Refuses to run with NODE_ENV=production.
 */
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

if (env.isProduction) {
  console.error("Refusing to seed while NODE_ENV=production. Seed data is for development only.");
  process.exit(1);
}

const TEST_DATA_TAG = "[TEST DATA]";

async function main(): Promise<void> {
  const category = await prisma.category.upsert({
    where: { slug: "bruno-demo-technology" },
    update: {},
    create: {
      name: "Bruno Demo Technology",
      slug: "bruno-demo-technology",
      division: "TECHNOLOGY",
      description: `${TEST_DATA_TAG} Seeded portfolio category for Bruno collection runs.`,
      displayOrder: 1,
      isActive: true,
    },
  });

  const service = await prisma.service.upsert({
    where: { slug: "website-development" },
    update: {},
    create: {
      title: "Website Development",
      slug: "website-development",
      division: "TECHNOLOGY",
      shortDescription: `${TEST_DATA_TAG} Full-stack website development service.`,
      description: `${TEST_DATA_TAG} Design, build, and launch of production websites and web applications.`,
      deliverables: ["Discovery workshop", "Design system", "Responsive build", "Launch support"],
      iconKey: "code",
      displayOrder: 1,
      isActive: true,
    },
  });

  const project = await prisma.project.upsert({
    where: { slug: "astrix-bruno-demo-project" },
    update: {},
    create: {
      title: "Astrix Bruno Demo Project",
      slug: "astrix-bruno-demo-project",
      division: "TECHNOLOGY",
      categoryId: category.id,
      shortDescription: `${TEST_DATA_TAG} A published demo project referenced by the Bruno collection.`,
      fullDescription: `${TEST_DATA_TAG} <p>This project exists so the Bruno collection has a stable, published record to fetch and mutate.</p>`,
      challenge: `${TEST_DATA_TAG} <p>Provide a deterministic fixture for API testing.</p>`,
      solution: `${TEST_DATA_TAG} <p>Seed an idempotent, published project.</p>`,
      process: `${TEST_DATA_TAG} <p>Upsert by slug on every seed run.</p>`,
      technologies: ["TypeScript", "Express", "PostgreSQL"],
      projectUrl: "https://example.com",
      repositoryUrl: "https://github.com/example/repo",
      isFeatured: true,
      status: "PUBLISHED",
    },
  });

  const creativeService = await prisma.service.upsert({
    where: { slug: "digital-marketing" },
    update: {},
    create: {
      title: "Digital Marketing",
      slug: "digital-marketing",
      division: "CREATIVE",
      shortDescription: `${TEST_DATA_TAG} Digital marketing campaigns and growth services.`,
      description: `${TEST_DATA_TAG} Strategy, campaign management and reporting for digital marketing.`,
      deliverables: ["Strategy document", "Campaign setup", "Monthly reporting"],
      iconKey: "megaphone",
      displayOrder: 2,
      isActive: true,
    },
  });

  await prisma.project.upsert({
    where: { slug: "astrix-bruno-draft-project" },
    update: {},
    create: {
      title: "Astrix Bruno Draft Project",
      slug: "astrix-bruno-draft-project",
      division: "TECHNOLOGY",
      shortDescription: `${TEST_DATA_TAG} An unpublished DRAFT project — must never appear publicly.`,
      fullDescription: `${TEST_DATA_TAG} <p>Draft fixture proving unpublished content stays private.</p>`,
      technologies: ["TypeScript"],
      isFeatured: false,
      status: "DRAFT",
    },
  });

  const existingTestimonial = await prisma.testimonial.findFirst({ where: { clientName: "Bruno Demo Client" } });
  const testimonial =
    existingTestimonial ??
    (await prisma.testimonial.create({
      data: {
        clientName: "Bruno Demo Client",
        designation: "Founder",
        companyName: "Demo Business",
        quote: `${TEST_DATA_TAG} Astrix Media delivered our website ahead of schedule.`,
        rating: 5,
        isPublished: true,
        displayOrder: 1,
      },
    }));

  // Dev-only values for the public homepage; refresh on every seed run.
  const settingsValues = {
    agencyName: "Astrix Media",
    tagline: `${TEST_DATA_TAG} Astrix Media — technology and creative studio.`,
    heroTitle: "We build brands and websites that grow businesses",
    heroSubtitle: `${TEST_DATA_TAG} Digital marketing and technology solutions under one roof.`,
    aboutIntro: `${TEST_DATA_TAG} Astrix Media is a technology and creative studio delivering websites, applications and digital marketing.`,
    contactEmail: "astrix.mediyeah@gmail.com",
    contactPhone: "+919876543210",
    whatsappNumber: "+919876543210",
    address: `${TEST_DATA_TAG} Kochi, Kerala, India`,
    socialInstagram: "https://instagram.com/astrixmedia",
    socialLinkedIn: "https://linkedin.com/company/astrixmedia",
    socialX: "https://x.com/astrixmedia",
    socialFacebook: "https://facebook.com/astrixmedia",
    socialYoutube: "https://youtube.com/@astrixmedia",
    footerText: `${TEST_DATA_TAG} (c) Astrix Media. All rights reserved.`,
    seoTitle: "Astrix Media",
    seoDescription: `${TEST_DATA_TAG} Portfolio site for Astrix Media.`,
  };

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: settingsValues,
    create: { id: "singleton", ...settingsValues },
  });

  console.log("Seed complete:");
  console.log(`  category: ${category.name} (${category.id})`);
  console.log(`  services: ${service.title} (${service.id}), ${creativeService.title} (${creativeService.id})`);
  console.log(`  projects: ${project.title} (${project.id}) [${project.status}]`);
  console.log(`  testimonial: ${testimonial.clientName} (${testimonial.id}) [published]`);
  console.log("  settings: singleton row ensured with public website fields");
  console.log("\nNo admin users were created — run `npm run admin:create` to add one.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => {
    prisma.$disconnect().catch(() => undefined);
  });
