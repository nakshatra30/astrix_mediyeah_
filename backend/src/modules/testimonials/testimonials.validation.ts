import { z } from "zod";
import { paginationSchema } from "../../utils/pagination.js";

// Base shape WITHOUT defaults (see projects.validation.ts for the reason).
const testimonialBase = z.strictObject({
  clientName: z.string().trim().min(1).max(120),
  designation: z.string().max(120).nullish(),
  companyName: z.string().max(160).nullish(),
  quote: z.string().trim().min(1).max(2000),
  rating: z.coerce.number().int().min(1).max(5),
  isPublished: z.boolean(),
  displayOrder: z.coerce.number().int().min(0).max(9999),
  avatarMediaAssetId: z.uuid().nullish(),
});

export const testimonialPayloadSchema = testimonialBase.extend({
  rating: z.coerce.number().int().min(1).max(5).default(5),
  isPublished: z.boolean().default(true),
  displayOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export type TestimonialPayload = z.infer<typeof testimonialPayloadSchema>;

/** PATCH accepts partial payloads — only provided keys are updated. */
export const testimonialUpdateSchema = testimonialBase.partial();
export type TestimonialUpdatePayload = z.infer<typeof testimonialUpdateSchema>;

export const publicTestimonialQuerySchema = paginationSchema;

export const adminTestimonialQuerySchema = paginationSchema.extend({
  isPublished: z.enum(["true", "false"]).optional(),
});
