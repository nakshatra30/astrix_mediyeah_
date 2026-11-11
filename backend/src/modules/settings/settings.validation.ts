import { z } from "zod";
import { httpUrlSchema, phoneSchema } from "../../validation/common.js";

const emailSchema = z.email().max(254).transform((value) => value.trim().toLowerCase());

export const settingsPayloadSchema = z.strictObject({
  agencyName: z.string().max(200).nullish(),
  tagline: z.string().max(300).nullish(),
  heroTitle: z.string().max(300).nullish(),
  heroSubtitle: z.string().max(500).nullish(),
  aboutIntro: z.string().max(2000).nullish(),
  contactEmail: emailSchema.nullish(),
  contactPhone: phoneSchema.nullish(),
  whatsappNumber: phoneSchema.nullish(),
  address: z.string().max(500).nullish(),
  socialInstagram: httpUrlSchema.nullish(),
  socialLinkedIn: httpUrlSchema.nullish(),
  socialX: httpUrlSchema.nullish(),
  socialFacebook: httpUrlSchema.nullish(),
  socialYoutube: httpUrlSchema.nullish(),
  footerText: z.string().max(1000).nullish(),
  seoTitle: z.string().max(300).nullish(),
  seoDescription: z.string().max(500).nullish(),
});

export type SettingsPayload = z.infer<typeof settingsPayloadSchema>;
