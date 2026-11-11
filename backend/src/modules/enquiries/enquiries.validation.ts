import { z } from "zod";
import { enquiryStatusSchema } from "../../validation/common.js";
import { paginationSchema } from "../../utils/pagination.js";

/** Public contact form — the only unauthenticated write endpoint. */
export const createEnquirySchema = z.strictObject({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254).transform((value) => value.trim().toLowerCase()),
  phone: z
    .string()
    .trim()
    .min(5)
    .max(30)
    .regex(/^[+()\-.\s\d]+$/, "Phone must contain only digits and + ( ) - . spaces")
    .nullish(),
  company: z.string().max(160).nullish(),
  serviceId: z.uuid().nullish(),
  serviceNameSnapshot: z.string().max(200).nullish(),
  budgetRange: z.string().max(100).nullish(),
  projectDescription: z.string().min(10).max(5000),
  privacyConsent: z.boolean().refine((value) => value === true, {
    message: "privacyConsent must be true to submit an enquiry",
  }),
  sourcePage: z.string().max(200).nullish(),
});

export type CreateEnquiryPayload = z.infer<typeof createEnquirySchema>;

/** Admin status transition — partial by design (status only). */
export const updateEnquirySchema = z.strictObject({
  status: enquiryStatusSchema,
});

export const adminEnquiryQuerySchema = paginationSchema.extend({
  status: enquiryStatusSchema.optional(),
});

export const createEnquiryNoteSchema = z.strictObject({
  body: z.string().trim().min(1).max(5000),
});
