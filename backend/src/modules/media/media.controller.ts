import multer from "multer";
import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import { ApiError, sendData, sendPaginated } from "../../utils/api.js";
import { computeMeta, parsePagination } from "../../utils/pagination.js";
import { detectImage } from "../../utils/images.js";
import { deleteStoredMedia, storeImage } from "../../storage/mediaStorage.js";
import { uuidParamSchema } from "../../validation/common.js";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Memory storage: the file never hits disk before magic-byte validation. */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 20, parts: 25 },
});

export async function uploadMedia(req: Request, res: Response): Promise<void> {
  if (req.file === undefined) {
    throw new ApiError(400, "VALIDATION_ERROR", "Multipart field 'file' is required");
  }
  // Validate by sniffing magic bytes, not the declared Content-Type.
  const info = detectImage(req.file.buffer);
  const stored = await storeImage(req.file.buffer, req.file.originalname, info);
  const asset = await prisma.mediaAsset.create({ data: stored });
  sendData(res, asset, 201);
}

export async function listMedia(req: Request, res: Response): Promise<void> {
  const pagination = parsePagination(req.query);
  const [total, assets] = await prisma.$transaction([
    prisma.mediaAsset.count(),
    prisma.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
  ]);
  sendPaginated(res, assets, computeMeta(pagination, total));
}

export async function deleteMedia(req: Request, res: Response): Promise<void> {
  const { id } = uuidParamSchema.parse(req.params);
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (asset === null) {
    throw new ApiError(404, "NOT_FOUND", "Media asset not found");
  }

  const [projectImageRefs, testimonialRefs] = await prisma.$transaction([
    prisma.projectImage.count({ where: { mediaAssetId: id } }),
    prisma.testimonial.count({ where: { avatarMediaAssetId: id } }),
  ]);
  if (projectImageRefs > 0 || testimonialRefs > 0) {
    throw new ApiError(409, "CONFLICT", "Media asset is referenced by a project image or testimonial and cannot be deleted");
  }

  const deleted = await prisma.mediaAsset.delete({ where: { id } });
  await deleteStoredMedia(deleted);
  sendData(res, deleted);
}
