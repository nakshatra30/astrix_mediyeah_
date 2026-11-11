import { z } from "zod";

export const divisionSchema = z.enum(["TECHNOLOGY", "CREATIVE"]);
export type Division = z.infer<typeof divisionSchema>;

export const projectStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export type ProjectStatusValue = z.infer<typeof projectStatusSchema>;

export const enquiryStatusSchema = z.enum(["NEW", "IN_PROGRESS", "CONTACTED", "CONVERTED", "CLOSED", "SPAM"]);
export type EnquiryStatusValue = z.infer<typeof enquiryStatusSchema>;

/** kebab-case slugs, as used across the public API. */
export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case (lowercase letters, digits, single hyphens)");

export const uuidParamSchema = z.strictObject({
  id: z.uuid("Route parameter :id must be a valid UUID"),
});

export const slugParamSchema = z.strictObject({
  slug: slugSchema,
});

export const httpUrlSchema = z
  .url()
  .max(2048)
  .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
    message: "URL must use http or https",
  });

/** International phone numbers: digits and + ( ) - . spaces only. */
export const phoneSchema = z
  .string()
  .trim()
  .min(5)
  .max(30)
  .regex(/^[+()\-.\s\d]+$/, "Phone must contain only digits and + ( ) - . spaces");

/** How an enquiry visitor prefers to be contacted (optional). */
export const preferredContactMethodSchema = z.enum(["EMAIL", "PHONE", "WHATSAPP"]);
