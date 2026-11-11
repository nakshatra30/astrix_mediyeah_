import { z } from "zod";

export const settingsPayloadSchema = z.strictObject({
  tagline: z.string().max(300).nullish(),
  seoTitle: z.string().max(300).nullish(),
  seoDescription: z.string().max(500).nullish(),
});

export type SettingsPayload = z.infer<typeof settingsPayloadSchema>;
