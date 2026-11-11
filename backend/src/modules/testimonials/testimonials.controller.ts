import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import { ApiError, sendData, sendPaginated } from "../../utils/api.js";
import { computeMeta } from "../../utils/pagination.js";
import { sanitizePlainText, sanitizeRichText } from "../../utils/sanitize.js";
import { uuidParamSchema } from "../../validation/common.js";
import { adminTestimonialQuerySchema, publicTestimonialQuerySchema, testimonialPayloadSchema, testimonialUpdateSchema, type TestimonialPayload } from "./testimonials.validation.js";

const listInclude = { avatar: { select: { id: true, url: true, filename: true } } } as const;

function normalize(payload: TestimonialPayload) {
  const quote = sanitizeRichText(payload.quote);
  return {
    clientName: payload.clientName,
    designation: sanitizePlainText(payload.designation),
    companyName: sanitizePlainText(payload.companyName),
    quote: quote === null ? "" : quote,
    rating: payload.rating,
    isPublished: payload.isPublished,
    displayOrder: payload.displayOrder,
    avatarMediaAssetId: payload.avatarMediaAssetId ?? null,
  };
}

async function assertAvatarExists(avatarMediaAssetId: string | null | undefined): Promise<void> {
  if (avatarMediaAssetId === null || avatarMediaAssetId === undefined) return;
  const asset = await prisma.mediaAsset.findUnique({ where: { id: avatarMediaAssetId }, select: { id: true } });
  if (asset === null) {
    throw new ApiError(400, "VALIDATION_ERROR", "Referenced avatarMediaAssetId does not exist");
  }
}

export async function publicListTestimonials(req: Request, res: Response): Promise<void> {
  const query = publicTestimonialQuerySchema.parse(req.query);
  const where = { isPublished: true };
  const [total, testimonials] = await prisma.$transaction([
    prisma.testimonial.count({ where }),
    prisma.testimonial.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: listInclude,
    }),
  ]);
  sendPaginated(res, testimonials, computeMeta(query, total));
}

export async function adminListTestimonials(req: Request, res: Response): Promise<void> {
  const query = adminTestimonialQuerySchema.parse(req.query);
  const where = {
    ...(query.isPublished !== undefined ? { isPublished: query.isPublished === "true" } : {}),
  };
  const [total, testimonials] = await prisma.$transaction([
    prisma.testimonial.count({ where }),
    prisma.testimonial.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: listInclude,
    }),
  ]);
  sendPaginated(res, testimonials, computeMeta(query, total));
}

export async function adminCreateTestimonial(req: Request, res: Response): Promise<void> {
  const payload = testimonialPayloadSchema.parse(req.body);
  await assertAvatarExists(payload.avatarMediaAssetId);
  const testimonial = await prisma.testimonial.create({ data: normalize(payload), include: listInclude });
  sendData(res, testimonial, 201);
}

export async function adminUpdateTestimonial(req: Request, res: Response): Promise<void> {
  const { id } = uuidParamSchema.parse(req.params);
  const payload = testimonialUpdateSchema.parse(req.body);
  const existing = await prisma.testimonial.findUnique({ where: { id }, select: { id: true } });
  if (existing === null) {
    throw new ApiError(404, "NOT_FOUND", "Testimonial not found");
  }
  if (payload.avatarMediaAssetId !== undefined) {
    await assertAvatarExists(payload.avatarMediaAssetId);
  }
  const data = {
    ...(payload.clientName !== undefined ? { clientName: payload.clientName } : {}),
    ...(payload.designation !== undefined ? { designation: sanitizePlainText(payload.designation) } : {}),
    ...(payload.companyName !== undefined ? { companyName: sanitizePlainText(payload.companyName) } : {}),
    ...(payload.quote !== undefined ? { quote: sanitizeRichText(payload.quote) ?? "" } : {}),
    ...(payload.rating !== undefined ? { rating: payload.rating } : {}),
    ...(payload.isPublished !== undefined ? { isPublished: payload.isPublished } : {}),
    ...(payload.displayOrder !== undefined ? { displayOrder: payload.displayOrder } : {}),
    ...(payload.avatarMediaAssetId !== undefined ? { avatarMediaAssetId: payload.avatarMediaAssetId ?? null } : {}),
  };
  const testimonial = await prisma.testimonial.update({ where: { id }, data, include: listInclude });
  sendData(res, testimonial);
}

/** Hard delete: testimonials carry no FK references other than an optional avatar. */
export async function adminDeleteTestimonial(req: Request, res: Response): Promise<void> {
  const { id } = uuidParamSchema.parse(req.params);
  const existing = await prisma.testimonial.findUnique({ where: { id }, include: listInclude });
  if (existing === null) {
    throw new ApiError(404, "NOT_FOUND", "Testimonial not found");
  }
  const deleted = await prisma.testimonial.delete({ where: { id }, include: listInclude });
  sendData(res, deleted);
}
