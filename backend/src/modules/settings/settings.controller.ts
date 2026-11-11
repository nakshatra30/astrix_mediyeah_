import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import { sendData } from "../../utils/api.js";
import { sanitizePlainText } from "../../utils/sanitize.js";
import { settingsPayloadSchema, type SettingsPayload } from "./settings.validation.js";

const SINGLETON_ID = "singleton";

/** Public projection of site settings — business info only, never admin data. */
export async function publicGetSettings(_req: Request, res: Response): Promise<void> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: SINGLETON_ID } });
  sendData(res, {
    id: SINGLETON_ID,
    agencyName: settings?.agencyName ?? null,
    tagline: settings?.tagline ?? null,
    heroTitle: settings?.heroTitle ?? null,
    heroSubtitle: settings?.heroSubtitle ?? null,
    aboutIntro: settings?.aboutIntro ?? null,
    contactEmail: settings?.contactEmail ?? null,
    contactPhone: settings?.contactPhone ?? null,
    whatsappNumber: settings?.whatsappNumber ?? null,
    address: settings?.address ?? null,
    socialInstagram: settings?.socialInstagram ?? null,
    socialLinkedIn: settings?.socialLinkedIn ?? null,
    socialX: settings?.socialX ?? null,
    socialFacebook: settings?.socialFacebook ?? null,
    socialYoutube: settings?.socialYoutube ?? null,
    footerText: settings?.footerText ?? null,
    seoTitle: settings?.seoTitle ?? null,
    seoDescription: settings?.seoDescription ?? null,
    updatedAt: settings?.updatedAt ?? null,
  });
}

const plainTextKeys = [
  "agencyName",
  "tagline",
  "heroTitle",
  "heroSubtitle",
  "aboutIntro",
  "contactEmail",
  "contactPhone",
  "whatsappNumber",
  "address",
  "socialInstagram",
  "socialLinkedIn",
  "socialX",
  "socialFacebook",
  "socialYoutube",
  "footerText",
  "seoTitle",
  "seoDescription",
] as const;

function buildUpdateData(payload: SettingsPayload) {
  const data: Record<string, string | null> = {};
  for (const key of plainTextKeys) {
    const value = payload[key];
    if (value !== undefined) {
      data[key] = sanitizePlainText(value);
    }
  }
  return data;
}

export async function adminUpdateSettings(req: Request, res: Response): Promise<void> {
  const payload = settingsPayloadSchema.parse(req.body);
  const data = buildUpdateData(payload);
  const settings = await prisma.siteSettings.upsert({
    where: { id: SINGLETON_ID },
    update: data,
    create: { id: SINGLETON_ID, ...data },
  });
  sendData(res, settings);
}
