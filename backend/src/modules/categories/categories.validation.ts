import { z } from "zod";
import { divisionSchema, slugSchema } from "../../validation/common.js";
import { paginationSchema } from "../../utils/pagination.js";

// Base shape WITHOUT defaults (see projects.validation.ts for the reason).
const categoryBase = z.strictObject({
  name: z.string().trim().min(1).max(120),
  slug: slugSchema,
  division: divisionSchema,
  description: z.string().max(2000).nullish(),
  displayOrder: z.coerce.number().int().min(0).max(9999),
  isActive: z.boolean(),
});

export const categoryPayloadSchema = categoryBase.extend({
  displayOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});

export type CategoryPayload = z.infer<typeof categoryPayloadSchema>;

/** PATCH accepts partial payloads — only provided keys are updated. */
export const categoryUpdateSchema = categoryBase.partial();
export type CategoryUpdatePayload = z.infer<typeof categoryUpdateSchema>;

export const publicCategoryQuerySchema = paginationSchema.extend({
  division: divisionSchema.optional(),
});

export const adminCategoryQuerySchema = paginationSchema.extend({
  division: divisionSchema.optional(),
  isActive: z.enum(["true", "false"]).optional(),
});
