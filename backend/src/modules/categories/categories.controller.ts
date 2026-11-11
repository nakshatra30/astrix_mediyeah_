import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import { ApiError, sendData, sendPaginated } from "../../utils/api.js";
import { computeMeta } from "../../utils/pagination.js";
import { sanitizePlainText } from "../../utils/sanitize.js";
import { uuidParamSchema } from "../../validation/common.js";
import { adminCategoryQuerySchema, categoryPayloadSchema, categoryUpdateSchema, publicCategoryQuerySchema, type CategoryPayload } from "./categories.validation.js";

const listInclude = { _count: { select: { projects: true } } } as const;

function normalize(payload: CategoryPayload) {
  return {
    name: payload.name,
    slug: payload.slug,
    division: payload.division,
    description: sanitizePlainText(payload.description),
    displayOrder: payload.displayOrder,
    isActive: payload.isActive,
  };
}

export async function publicListCategories(req: Request, res: Response): Promise<void> {
  const query = publicCategoryQuerySchema.parse(req.query);
  const where = {
    isActive: true,
    ...(query.division !== undefined ? { division: query.division } : {}),
  };
  const [total, categories] = await prisma.$transaction([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: listInclude,
    }),
  ]);
  sendPaginated(res, categories, computeMeta(query, total));
}

export async function adminListCategories(req: Request, res: Response): Promise<void> {
  const query = adminCategoryQuerySchema.parse(req.query);
  const where = {
    ...(query.division !== undefined ? { division: query.division } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive === "true" } : {}),
  };
  const [total, categories] = await prisma.$transaction([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: listInclude,
    }),
  ]);
  sendPaginated(res, categories, computeMeta(query, total));
}

export async function adminCreateCategory(req: Request, res: Response): Promise<void> {
  const payload = categoryPayloadSchema.parse(req.body);
  const category = await prisma.category.create({ data: normalize(payload), include: listInclude });
  sendData(res, category, 201);
}

export async function adminUpdateCategory(req: Request, res: Response): Promise<void> {
  const { id } = uuidParamSchema.parse(req.params);
  const payload = categoryUpdateSchema.parse(req.body);
  const existing = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (existing === null) {
    throw new ApiError(404, "NOT_FOUND", "Category not found");
  }
  const data = {
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    ...(payload.slug !== undefined ? { slug: payload.slug } : {}),
    ...(payload.division !== undefined ? { division: payload.division } : {}),
    ...(payload.description !== undefined ? { description: sanitizePlainText(payload.description) } : {}),
    ...(payload.displayOrder !== undefined ? { displayOrder: payload.displayOrder } : {}),
    ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
  };
  const category = await prisma.category.update({ where: { id }, data, include: listInclude });
  sendData(res, category);
}

/** Soft delete: deactivate instead of destroying rows (FK targets on projects). */
export async function adminDeactivateCategory(req: Request, res: Response): Promise<void> {
  const { id } = uuidParamSchema.parse(req.params);
  const existing = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (existing === null) {
    throw new ApiError(404, "NOT_FOUND", "Category not found");
  }
  const category = await prisma.category.update({
    where: { id },
    data: { isActive: false },
    include: listInclude,
  });
  sendData(res, category);
}
