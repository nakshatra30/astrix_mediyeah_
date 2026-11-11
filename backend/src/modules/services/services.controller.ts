import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import { ApiError, sendData, sendPaginated } from "../../utils/api.js";
import { computeMeta } from "../../utils/pagination.js";
import { sanitizePlainText, sanitizeRichText } from "../../utils/sanitize.js";
import { slugParamSchema, uuidParamSchema } from "../../validation/common.js";
import { adminServiceQuerySchema, publicServiceQuerySchema, servicePayloadSchema, serviceUpdateSchema, type ServicePayload } from "./services.validation.js";

const listInclude = { _count: { select: { enquiries: true } } } as const;

function normalize(payload: ServicePayload) {
  return {
    title: payload.title,
    slug: payload.slug,
    division: payload.division,
    shortDescription: sanitizePlainText(payload.shortDescription),
    description: sanitizeRichText(payload.description),
    deliverables: payload.deliverables.map((item) => item.trim()).filter((item) => item !== ""),
    iconKey: sanitizePlainText(payload.iconKey),
    displayOrder: payload.displayOrder,
    isActive: payload.isActive,
  };
}

export async function publicListServices(req: Request, res: Response): Promise<void> {
  const query = publicServiceQuerySchema.parse(req.query);
  const where = {
    isActive: true,
    ...(query.division !== undefined ? { division: query.division } : {}),
  };
  const [total, services] = await prisma.$transaction([
    prisma.service.count({ where }),
    prisma.service.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { title: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: listInclude,
    }),
  ]);
  sendPaginated(res, services, computeMeta(query, total));
}

export async function publicGetServiceBySlug(req: Request, res: Response): Promise<void> {
  const { slug } = slugParamSchema.parse(req.params);
  const service = await prisma.service.findFirst({ where: { slug, isActive: true }, include: listInclude });
  if (service === null) {
    throw new ApiError(404, "NOT_FOUND", "Service not found");
  }
  sendData(res, service);
}

export async function adminListServices(req: Request, res: Response): Promise<void> {
  const query = adminServiceQuerySchema.parse(req.query);
  const where = {
    ...(query.division !== undefined ? { division: query.division } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive === "true" } : {}),
  };
  const [total, services] = await prisma.$transaction([
    prisma.service.count({ where }),
    prisma.service.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { title: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: listInclude,
    }),
  ]);
  sendPaginated(res, services, computeMeta(query, total));
}

export async function adminGetService(req: Request, res: Response): Promise<void> {
  const { id } = uuidParamSchema.parse(req.params);
  const service = await prisma.service.findUnique({ where: { id }, include: listInclude });
  if (service === null) {
    throw new ApiError(404, "NOT_FOUND", "Service not found");
  }
  sendData(res, service);
}

export async function adminCreateService(req: Request, res: Response): Promise<void> {
  const payload = servicePayloadSchema.parse(req.body);
  const service = await prisma.service.create({ data: normalize(payload), include: listInclude });
  sendData(res, service, 201);
}

export async function adminUpdateService(req: Request, res: Response): Promise<void> {
  const { id } = uuidParamSchema.parse(req.params);
  const payload = serviceUpdateSchema.parse(req.body);
  const existing = await prisma.service.findUnique({ where: { id }, select: { id: true } });
  if (existing === null) {
    throw new ApiError(404, "NOT_FOUND", "Service not found");
  }
  const data = {
    ...(payload.title !== undefined ? { title: payload.title } : {}),
    ...(payload.slug !== undefined ? { slug: payload.slug } : {}),
    ...(payload.division !== undefined ? { division: payload.division } : {}),
    ...(payload.shortDescription !== undefined ? { shortDescription: sanitizePlainText(payload.shortDescription) } : {}),
    ...(payload.description !== undefined ? { description: sanitizeRichText(payload.description) } : {}),
    ...(payload.deliverables !== undefined
      ? { deliverables: payload.deliverables.map((item) => item.trim()).filter((item) => item !== "") }
      : {}),
    ...(payload.iconKey !== undefined ? { iconKey: sanitizePlainText(payload.iconKey) } : {}),
    ...(payload.displayOrder !== undefined ? { displayOrder: payload.displayOrder } : {}),
    ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
  };
  const service = await prisma.service.update({ where: { id }, data, include: listInclude });
  sendData(res, service);
}

/** Soft delete: deactivate instead of destroying rows (FK targets on enquiries). */
export async function adminDeactivateService(req: Request, res: Response): Promise<void> {
  const { id } = uuidParamSchema.parse(req.params);
  const existing = await prisma.service.findUnique({ where: { id }, select: { id: true } });
  if (existing === null) {
    throw new ApiError(404, "NOT_FOUND", "Service not found");
  }
  const service = await prisma.service.update({ where: { id }, data: { isActive: false }, include: listInclude });
  sendData(res, service);
}
