import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import { sendData } from "../../utils/api.js";

const SINGLETON_ID = "singleton";
const HOME_TAKE = 6;

/**
 * GET /public/home — one aggregate payload for the marketing homepage:
 * agency identity, hero, featured services/projects, approved testimonials,
 * contact info and social links. All sections degrade to null/[] when unset.
 */
export async function publicGetHome(_req: Request, res: Response): Promise<void> {
  const [settings, featuredServices, featuredProjects, testimonials] = await prisma.$transaction([
    prisma.siteSettings.findUnique({ where: { id: SINGLETON_ID } }),
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { title: "asc" }],
      take: HOME_TAKE,
      select: {
        id: true,
        title: true,
        slug: true,
        division: true,
        shortDescription: true,
        iconKey: true,
        displayOrder: true,
      },
    }),
    prisma.project.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: HOME_TAKE,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: {
          orderBy: { displayOrder: "asc" },
          take: 1,
          select: { altText: true, mediaAsset: { select: { id: true, url: true } } },
        },
      },
    }),
    prisma.testimonial.findMany({
      where: { isPublished: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      take: HOME_TAKE,
      select: {
        id: true,
        clientName: true,
        designation: true,
        companyName: true,
        quote: true,
        rating: true,
        displayOrder: true,
      },
    }),
  ]);

  sendData(res, {
    agency: {
      name: settings?.agencyName ?? null,
      tagline: settings?.tagline ?? null,
    },
    hero: {
      title: settings?.heroTitle ?? null,
      subtitle: settings?.heroSubtitle ?? null,
    },
    about: {
      intro: settings?.aboutIntro ?? null,
    },
    services: {
      featured: featuredServices,
    },
    projects: {
      featured: featuredProjects.map(({ images, ...project }) => ({
        ...project,
        thumbnail: images[0]?.mediaAsset.url ?? null,
        thumbnailAltText: images[0]?.altText ?? null,
      })),
    },
    testimonials: {
      approved: testimonials,
    },
    contact: {
      email: settings?.contactEmail ?? null,
      phone: settings?.contactPhone ?? null,
      whatsapp: settings?.whatsappNumber ?? null,
      address: settings?.address ?? null,
    },
    social: {
      instagram: settings?.socialInstagram ?? null,
      linkedin: settings?.socialLinkedIn ?? null,
      x: settings?.socialX ?? null,
      facebook: settings?.socialFacebook ?? null,
      youtube: settings?.socialYoutube ?? null,
    },
    seo: {
      title: settings?.seoTitle ?? null,
      description: settings?.seoDescription ?? null,
    },
  });
}
