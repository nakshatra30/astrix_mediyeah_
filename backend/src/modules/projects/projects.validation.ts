import { z } from "zod";
import { divisionSchema, httpUrlSchema, projectStatusSchema, slugSchema } from "../../validation/common.js";
import { paginationSchema } from "../../utils/pagination.js";

const richText = z.string().max(20_000).nullish();
const plainText = (max: number) => z.string().max(max).nullish();

// Base shape WITHOUT defaults: .partial() on it yields truly-optional keys.
// (Zod 4 keeps .default() through .partial(), which would silently rewrite
// untouched fields like status/technologies on PATCH.)
const projectBase = z.strictObject({
  title: z.string().trim().min(1).max(200),
  slug: slugSchema,
  division: divisionSchema,
  categoryId: z.uuid().nullish(),
  shortDescription: plainText(300),
  fullDescription: richText,
  challenge: richText,
  solution: richText,
  process: richText,
  technologies: z.array(z.string().trim().min(1).max(100)).max(50),
  projectUrl: httpUrlSchema.nullish(),
  repositoryUrl: httpUrlSchema.nullish(),
  isFeatured: z.boolean(),
  status: projectStatusSchema,
});

export const projectPayloadSchema = projectBase.extend({
  technologies: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  isFeatured: z.boolean().default(false),
  status: projectStatusSchema.default("DRAFT"),
});

export type ProjectPayload = z.infer<typeof projectPayloadSchema>;

/** PATCH accepts partial payloads — only provided keys are updated. */
export const projectUpdateSchema = projectBase.partial();
export type ProjectUpdatePayload = z.infer<typeof projectUpdateSchema>;

export const publicProjectQuerySchema = paginationSchema.extend({
  division: divisionSchema.optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});

export const adminProjectQuerySchema = publicProjectQuerySchema.extend({
  status: projectStatusSchema.optional(),
});
