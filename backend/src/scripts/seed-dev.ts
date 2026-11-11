/**
 * Development seed data for the Bruno collection flow.
 * - Idempotent: everything is upserted by a stable slug/key.
 * - Create-only: existing rows are never overwritten, so edits made in the
 *   admin panel survive re-seeding.
 * - NEVER creates admin users (use `npm run admin:create`).
 * - Refuses to run with NODE_ENV=production.
 */
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

if (env.isProduction) {
  console.error("Refusing to seed while NODE_ENV=production. Seed data is for development only.");
  process.exit(1);
}

async function main(): Promise<void> {
  const categories = await Promise.all(
    [
      { name: "Web & Apps", slug: "web-apps", division: "TECHNOLOGY" as const, description: "Websites, portals and applications.", displayOrder: 1 },
      { name: "E-Commerce", slug: "e-commerce", division: "TECHNOLOGY" as const, description: "Online stores and commerce integrations.", displayOrder: 2 },
      { name: "Branding & Design", slug: "branding-design", division: "CREATIVE" as const, description: "Identity systems and visual design.", displayOrder: 3 },
      { name: "Film & Photo", slug: "film-photo", division: "CREATIVE" as const, description: "Video production and photography.", displayOrder: 4 },
    ].map((data) =>
      prisma.category.upsert({
        where: { slug: data.slug },
        update: {},
        create: { ...data, isActive: true },
      }),
    ),
  );

  const services = await Promise.all(
    [
      {
        title: "Website Development",
        slug: "website-development",
        division: "TECHNOLOGY" as const,
        shortDescription: "Full stack website development service.",
        description: "Design, build, and launch of production websites and web applications.",
        deliverables: ["Discovery workshop", "Design system", "Responsive build", "Launch support"],
        iconKey: "code",
        displayOrder: 1,
      },
      {
        title: "Custom Web Applications",
        slug: "custom-web-applications",
        division: "TECHNOLOGY" as const,
        shortDescription: "Bespoke portals, dashboards and SaaS products built to spec.",
        description: "Full-cycle application development — architecture, build, testing and deployment of production web software.",
        deliverables: ["Technical spec", "UI build", "API layer", "Deployment pipeline"],
        iconKey: "layers",
        displayOrder: 2,
      },
      {
        title: "Digital Marketing",
        slug: "digital-marketing",
        division: "CREATIVE" as const,
        shortDescription: "Digital marketing campaigns and growth services.",
        description: "Strategy, campaign management and reporting for digital marketing.",
        deliverables: ["Strategy document", "Campaign setup", "Monthly reporting"],
        iconKey: "megaphone",
        displayOrder: 3,
      },
      {
        title: "Brand Identity Design",
        slug: "brand-identity-design",
        division: "CREATIVE" as const,
        shortDescription: "Logos, identity systems and brand guidelines.",
        description: "Naming support, logo systems, typography, colour and usage guidelines that scale across touchpoints.",
        deliverables: ["Logo suite", "Brand guidelines", "Stationery set", "Social kit"],
        iconKey: "palette",
        displayOrder: 4,
      },
      {
        title: "Video Production",
        slug: "video-production",
        division: "CREATIVE" as const,
        shortDescription: "Brand films, promos and product videos end to end.",
        description: "Scripting, shooting, motion graphics, editing and colour for brand and product films.",
        deliverables: ["Creative script", "Shoot day", "Motion graphics", "Final cut + subtitles"],
        iconKey: "video",
        displayOrder: 5,
      },
      {
        title: "Photography",
        slug: "photography",
        division: "CREATIVE" as const,
        shortDescription: "Product, people and place photography for brand use.",
        description: "Planned shoots with art direction, retouching and a licensed, organised library.",
        deliverables: ["Shot list", "On-location shoot", "Retouched set", "Licensed library"],
        iconKey: "camera",
        displayOrder: 6,
      },
      {
        title: "Social Media Management",
        slug: "social-media-management",
        division: "CREATIVE" as const,
        shortDescription: "Always-on content, community and calendar management.",
        description: "Content calendars, community management and monthly performance reviews across platforms.",
        deliverables: ["Content calendar", "Monthly creatives", "Community replies", "Performance report"],
        iconKey: "share",
        displayOrder: 7,
      },
    ].map((data) =>
      prisma.service.upsert({
        where: { slug: data.slug },
        update: {},
        create: { ...data, isActive: true },
      }),
    ),
  );

  // Create-only: never overwrites settings edited in the admin panel.
  const settingsValues = {
    agencyName: "Astrix Mediyeah",
    tagline: "Astrix Mediyeah — technology and creative studio.",
    heroTitle: "We build brands and websites that grow businesses",
    heroSubtitle: "Digital marketing and technology solutions under one roof.",
    aboutIntro: "Astrix Mediyeah is a technology and creative studio delivering websites, applications and digital marketing.",
    contactEmail: "astrix.mediyeah@gmail.com",
    contactPhone: "+919876543210",
    whatsappNumber: "+919876543210",
    address: "Coimbatore, Tamil Nadu",
    socialInstagram: "https://instagram.com/astrixmedia",
    socialLinkedIn: "https://linkedin.com/company/astrixmedia",
    socialX: "https://x.com/astrixmedia",
    socialFacebook: "https://facebook.com/astrixmedia",
    socialYoutube: "https://youtube.com/@astrixmedia",
    footerText: "Astrix Mediyeah. All rights reserved.",
    seoTitle: "Astrix Mediyeah",
    seoDescription: "Portfolio site for Astrix Mediyeah.",
  };

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", ...settingsValues },
  });

  console.log("Seed complete:");
  console.log(`  categories: ${categories.map((c) => c.name).join(", ")}`);
  console.log(`  services: ${services.map((s) => s.title).join(", ")}`);
  console.log("  projects: none (the Projects section starts empty)");
  console.log("  testimonials: none (the Testimonials section starts empty)");
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
