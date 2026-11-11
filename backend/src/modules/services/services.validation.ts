import { z } from "zod";
import { divisionSchema, slugSchema } from "../../validation/common.js";
import { paginationSchema } from "../../utils/pagination.js";

// Base shape WITHOUT defaults (see projects.validation.ts for the reason).
const serviceBase = z.strictObject({
  title: z.string().trim().min(1).max(200),
  slug: slugSchema,
  division: divisionSchema,
  shortDescription: z.string().max(300).nullish(),
  description: z.string().max(20_000).nullish(),
  deliverables: z.array(z.string().trim().min(1).max(200)).max(50),
  iconKey: z.string().trim().max(100).nullish(),
  displayOrder: z.coerce.number().int().min(0).max(9999),
  isActive: z.boolean(),
});

export const servicePayloadSchema = serviceBase.extend({
  deliverables: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
  displayOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});

export type ServicePayload = z.infer<typeof servicePayloadSchema>;

/** PATCH accepts partial payloads — only provided keys are updated. */
export const serviceUpdateSchema = serviceBase.partial();
export type ServiceUpdatePayload = z.infer<typeof serviceUpdateSchema>;

export const publicServiceQuerySchema = paginationSchema.extend({
  division: divisionSchema.optional(),
});

export const adminServiceQuerySchema = paginationSchema.extend({
  division: divisionSchema.optional(),
  isActive: z.enum(["true", "false"]).optional(),
});
