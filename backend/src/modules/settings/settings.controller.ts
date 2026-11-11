import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import { sendData } from "../../utils/api.js";
import { sanitizePlainText } from "../../utils/sanitize.js";
import { settingsPayloadSchema } from "./settings.validation.js";

const SINGLETON_ID = "singleton";

export async function publicGetSettings(_req: Request, res: Response): Promise<void> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: SINGLETON_ID } });
  sendData(res, {
    id: SINGLETON_ID,
    tagline: settings?.tagline ?? null,
    seoTitle: settings?.seoTitle ?? null,
    seoDescription: settings?.seoDescription ?? null,
    updatedAt: settings?.updatedAt ?? null,
  });
}

export async function adminUpdateSettings(req: Request, res: Response): Promise<void> {
  const payload = settingsPayloadSchema.parse(req.body);
  const data = {
    ...(payload.tagline !== undefined ? { tagline: sanitizePlainText(payload.tagline) } : {}),
    ...(payload.seoTitle !== undefined ? { seoTitle: sanitizePlainText(payload.seoTitle) } : {}),
    ...(payload.seoDescription !== undefined ? { seoDescription: sanitizePlainText(payload.seoDescription) } : {}),
  };
  const settings = await prisma.siteSettings.upsert({
    where: { id: SINGLETON_ID },
    update: data,
    create: { id: SINGLETON_ID, ...data },
  });
  sendData(res, settings);
}
