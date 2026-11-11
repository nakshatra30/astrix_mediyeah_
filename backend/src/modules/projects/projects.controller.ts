import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import { ApiError, sendData, sendPaginated } from "../../utils/api.js";
import { computeMeta } from "../../utils/pagination.js";
import { sanitizePlainText, sanitizeRichText } from "../../utils/sanitize.js";
import { slugParamSchema, uuidParamSchema } from "../../validation/common.js";
import {
  adminProjectQuerySchema,
  projectPayloadSchema,
  projectUpdateSchema,
  publicProjectQuerySchema,
  type ProjectPayload,
} from "./projects.validation.js";

const categoryInclude = {
  category: { select: { id: true, name: true, slug: true } },
  _count: { select: { images: true } },
} as const;

function normalize(payload: ProjectPayload) {
  return {
    title: payload.title,
    slug: payload.slug,
    division: payload.division,
    categoryId: payload.categoryId ?? null,
    shortDescription: sanitizePlainText(payload.shortDescription),
    fullDescription: sanitizeRichText(payload.fullDescription),
    challenge: sanitizeRichText(payload.challenge),
    solution: sanitizeRichText(payload.solution),
    process: sanitizeRichText(payload.process),
    technologies: payload.technologies.map((tech) => tech.trim()).filter((tech) => tech !== ""),
    projectUrl: payload.projectUrl ?? null,
    repositoryUrl: payload.repositoryUrl ?? null,
    isFeatured: payload.isFeatured,
    status: payload.status,
  };
}

async function assertCategoryExists(categoryId: string | null | undefined): Promise<void> {
  if (categoryId === null || categoryId === undefined) return;
  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (category === null) {
    throw new ApiError(400, "VALIDATION_ERROR", "Referenced categoryId does not exist");
  }
}

export async function publicListProjects(req: Request, res: Response): Promise<void> {
  const query = publicProjectQuerySchema.parse(req.query);
  const where = {
    status: "PUBLISHED" as const,
    ...(query.division !== undefined ? { division: query.division } : {}),
  };
  const [total, projects] = await prisma.$transaction([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy: query.sort === "newest" ? { createdAt: "desc" } : { createdAt: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: categoryInclude,
    }),
  ]);
  sendPaginated(res, projects, computeMeta(query, total));
}

export async function publicGetProjectBySlug(req: Request, res: Response): Promise<void> {
  const { slug } = slugParamSchema.parse(req.params);
  const project = await prisma.project.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      ...categoryInclude,
      images: {
        orderBy: { displayOrder: "asc" },
        select: { id: true, altText: true, displayOrder: true, mediaAsset: { select: { id: true, url: true, filename: true } } },
      },
    },
  });
  if (project === null) {
    throw new ApiError(404, "NOT_FOUND", "Project not found");
  }
  sendData(res, project);
}

export async function adminListProjects(req: Request, res: Response): Promise<void> {
  const query = adminProjectQuerySchema.parse(req.query);
  const where = {
    ...(query.status !== undefined ? { status: query.status } : {}),
    ...(query.division !== undefined ? { division: query.division } : {}),
  };
  const [total, projects] = await prisma.$transaction([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy: query.sort === "newest" ? { createdAt: "desc" } : { createdAt: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: categoryInclude,
    }),
  ]);
  sendPaginated(res, projects, computeMeta(query, total));
}

export async function adminGetProject(req: Request, res: Response): Promise<void> {
  const { id } = uuidParamSchema.parse(req.params);
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      ...categoryInclude,
      images: {
        orderBy: { displayOrder: "asc" },
        select: { id: true, altText: true, displayOrder: true, mediaAsset: { select: { id: true, url: true, filename: true } } },
      },
    },
  });
  if (project === null) {
    throw new ApiError(404, "NOT_FOUND", "Project not found");
  }
  sendData(res, project);
}

export async function adminCreateProject(req: Request, res: Response): Promise<void> {
  const payload = projectPayloadSchema.parse(req.body);
  await assertCategoryExists(payload.categoryId);
  const project = await prisma.project.create({
    data: normalize(payload),
    include: categoryInclude,
  });
  sendData(res, project, 201);
}

export async function adminUpdateProject(req: Request, res: Response): Promise<void> {
  const { id } = uuidParamSchema.parse(req.params);
  const payload = projectUpdateSchema.parse(req.body);
  const existing = await prisma.project.findUnique({ where: { id }, select: { id: true } });
  if (existing === null) {
    throw new ApiError(404, "NOT_FOUND", "Project not found");
  }
  if (payload.categoryId !== undefined) {
    await assertCategoryExists(payload.categoryId);
  }
  const data = {
    ...(payload.title !== undefined ? { title: payload.title } : {}),
    ...(payload.slug !== undefined ? { slug: payload.slug } : {}),
    ...(payload.division !== undefined ? { division: payload.division } : {}),
    ...(payload.categoryId !== undefined ? { categoryId: payload.categoryId } : {}),
    ...(payload.shortDescription !== undefined ? { shortDescription: sanitizePlainText(payload.shortDescription) } : {}),
    ...(payload.fullDescription !== undefined ? { fullDescription: sanitizeRichText(payload.fullDescription) } : {}),
    ...(payload.challenge !== undefined ? { challenge: sanitizeRichText(payload.challenge) } : {}),
    ...(payload.solution !== undefined ? { solution: sanitizeRichText(payload.solution) } : {}),
    ...(payload.process !== undefined ? { process: sanitizeRichText(payload.process) } : {}),
    ...(payload.technologies !== undefined
      ? { technologies: payload.technologies.map((tech) => tech.trim()).filter((tech) => tech !== "") }
      : {}),
    ...(payload.projectUrl !== undefined ? { projectUrl: payload.projectUrl ?? null } : {}),
    ...(payload.repositoryUrl !== undefined ? { repositoryUrl: payload.repositoryUrl ?? null } : {}),
    ...(payload.isFeatured !== undefined ? { isFeatured: payload.isFeatured } : {}),
    ...(payload.status !== undefined ? { status: payload.status } : {}),
  };
  const project = await prisma.project.update({
    where: { id },
    data,
    include: categoryInclude,
  });
  sendData(res, project);
}

/** Soft delete: archive instead of destroying rows (portfolio history). */
export async function adminArchiveProject(req: Request, res: Response): Promise<void> {
  const { id } = uuidParamSchema.parse(req.params);
  const existing = await prisma.project.findUnique({ where: { id }, select: { id: true } });
  if (existing === null) {
    throw new ApiError(404, "NOT_FOUND", "Project not found");
  }
  const project = await prisma.project.update({
    where: { id },
    data: { status: "ARCHIVED" },
    include: categoryInclude,
  });
  sendData(res, project);
}
