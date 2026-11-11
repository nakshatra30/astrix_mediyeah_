import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import { ApiError, sendData, sendPaginated } from "../../utils/api.js";
import { computeMeta } from "../../utils/pagination.js";
import { sanitizePlainText, sanitizeRichText } from "../../utils/sanitize.js";
import { uuidParamSchema } from "../../validation/common.js";
import {
  adminEnquiryQuerySchema,
  createEnquiryNoteSchema,
  createEnquirySchema,
  updateEnquirySchema,
  type CreateEnquiryPayload,
} from "./enquiries.validation.js";

const enquiryInclude = {
  service: { select: { id: true, title: true, slug: true } },
} as const;

function normalize(payload: CreateEnquiryPayload) {
  return {
    name: payload.name,
    email: payload.email,
    phone: payload.phone ?? null,
    company: sanitizePlainText(payload.company),
    serviceId: payload.serviceId ?? null,
    serviceNameSnapshot: sanitizePlainText(payload.serviceNameSnapshot),
    budgetRange: sanitizePlainText(payload.budgetRange),
    preferredContactMethod: payload.preferredContactMethod ?? null,
    projectDescription: sanitizeRichText(payload.projectDescription) ?? "",
    privacyConsent: payload.privacyConsent,
    sourcePage: sanitizePlainText(payload.sourcePage),
  };
}

export async function publicCreateEnquiry(req: Request, res: Response): Promise<void> {
  const payload = createEnquirySchema.parse(req.body);

  if (payload.serviceId !== null && payload.serviceId !== undefined) {
    const service = await prisma.service.findUnique({
      where: { id: payload.serviceId },
      select: { id: true, isActive: true, title: true },
    });
    if (service === null || !service.isActive) {
      throw new ApiError(400, "VALIDATION_ERROR", "Referenced serviceId does not exist or is not active");
    }
    const data = normalize(payload);
    const snapshot = data.serviceNameSnapshot ?? service.title;
    const enquiry = await prisma.enquiry.create({ data: { ...data, serviceNameSnapshot: snapshot }, include: enquiryInclude });
    sendData(res, enquiry, 201);
    return;
  }

  const enquiry = await prisma.enquiry.create({ data: normalize(payload), include: enquiryInclude });
  sendData(res, enquiry, 201);
}

export async function adminListEnquiries(req: Request, res: Response): Promise<void> {
  const query = adminEnquiryQuerySchema.parse(req.query);
  const where = {
    ...(query.status !== undefined ? { status: query.status } : {}),
  };
  const [total, enquiries] = await prisma.$transaction([
    prisma.enquiry.count({ where }),
    prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: enquiryInclude,
    }),
  ]);
  sendPaginated(res, enquiries, computeMeta(query, total));
}

export async function adminGetEnquiry(req: Request, res: Response): Promise<void> {
  const { id } = uuidParamSchema.parse(req.params);
  const enquiry = await prisma.enquiry.findUnique({
    where: { id },
    include: {
      ...enquiryInclude,
      notes: { orderBy: { createdAt: "asc" } },
    },
  });
  if (enquiry === null) {
    throw new ApiError(404, "NOT_FOUND", "Enquiry not found");
  }
  sendData(res, enquiry);
}

export async function adminUpdateEnquiryStatus(req: Request, res: Response): Promise<void> {
  const { id } = uuidParamSchema.parse(req.params);
  const { status } = updateEnquirySchema.parse(req.body);
  const existing = await prisma.enquiry.findUnique({ where: { id }, select: { id: true } });
  if (existing === null) {
    throw new ApiError(404, "NOT_FOUND", "Enquiry not found");
  }
  const enquiry = await prisma.enquiry.update({ where: { id }, data: { status }, include: enquiryInclude });
  sendData(res, enquiry);
}

export async function adminCreateEnquiryNote(req: Request, res: Response): Promise<void> {
  const { id } = uuidParamSchema.parse(req.params);
  const { body } = createEnquiryNoteSchema.parse(req.body);
  const enquiry = await prisma.enquiry.findUnique({ where: { id }, select: { id: true } });
  if (enquiry === null) {
    throw new ApiError(404, "NOT_FOUND", "Enquiry not found");
  }
  const note = await prisma.enquiryNote.create({
    data: { enquiryId: id, body: sanitizeRichText(body) ?? "" },
  });
  sendData(res, note, 201);
}

export async function adminListEnquiryNotes(req: Request, res: Response): Promise<void> {
  const { id } = uuidParamSchema.parse(req.params);
  const enquiry = await prisma.enquiry.findUnique({ where: { id }, select: { id: true } });
  if (enquiry === null) {
    throw new ApiError(404, "NOT_FOUND", "Enquiry not found");
  }
  const notes = await prisma.enquiryNote.findMany({ where: { enquiryId: id }, orderBy: { createdAt: "asc" } });
  sendData(res, notes);
}
