import { z } from "zod";

export const loginSchema = z.strictObject({
  email: z.email().max(254).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1).max(200),
});

export const changePasswordSchema = z
  .strictObject({
    currentPassword: z.string().min(1).max(200),
    newPassword: z
      .string()
      .min(10, "New password must be at least 10 characters")
      .refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
        message: "New password must be at most 72 bytes",
      }),
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    message: "New password must differ from the current password",
    path: ["newPassword"],
  });
