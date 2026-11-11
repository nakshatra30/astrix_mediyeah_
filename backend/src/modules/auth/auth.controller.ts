import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { ApiError, sendData } from "../../utils/api.js";
import { sessionTtlMs } from "../../middleware/session.js";
import { changePasswordSchema, loginSchema } from "./auth.validation.js";

/**
 * Hash of a random unknown password, computed once at startup with the same
 * cost factor as real hashes so that login attempts against non-existent
 * emails burn the same bcrypt time as real ones (timing equalization).
 */
const DUMMY_HASH = bcrypt.hashSync(randomBytes(24).toString("base64"), env.bcryptRounds);

function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.adminUser.findUnique({ where: { email } });
  const passwordMatches =
    user !== null ? await bcrypt.compare(password, user.passwordHash) : await bcrypt.compare(password, DUMMY_HASH);

  if (user === null || !passwordMatches) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const sessionId = randomBytes(32).toString("hex");
  const csrfToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + sessionTtlMs());

  const [updatedUser] = await prisma.$transaction([
    prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: { id: true, name: true, email: true, lastLoginAt: true },
    }),
    prisma.adminSession.create({
      data: { id: sessionId, csrfToken, userId: user.id, expiresAt },
    }),
  ]);

  res.cookie(env.sessionCookieName, sessionId, sessionCookieOptions(expiresAt));
  sendData(res, updatedUser);
}

export async function me(_req: Request, res: Response): Promise<void> {
  const user = await prisma.adminUser.findUnique({
    where: { id: res.locals.adminUserId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
  if (user === null) {
    throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
  }
  sendData(res, { ...user, csrfToken: res.locals.adminCsrfToken });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const sessionId = req.cookies?.[env.sessionCookieName];
  if (typeof sessionId === "string" && sessionId !== "") {
    await prisma.adminSession.deleteMany({ where: { id: sessionId } });
  }
  res.clearCookie(env.sessionCookieName, { path: "/", httpOnly: true, sameSite: "lax" });
  res.status(204).send();
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const userId = res.locals.adminUserId as string;
  const currentSessionId = req.cookies?.[env.sessionCookieName];

  const user = await prisma.adminUser.findUnique({ where: { id: userId } });
  if (user === null) {
    throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
  }

  const currentMatches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!currentMatches) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(newPassword, env.bcryptRounds);

  await prisma.$transaction([
    prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash } }),
    // Revoke every other session for this user (all devices).
    prisma.adminSession.deleteMany({
      where: { userId: user.id, ...(typeof currentSessionId === "string" ? { id: { not: currentSessionId } } : {}) },
    }),
  ]);

  sendData(res, { message: "Password updated. Other sessions have been signed out." });
}
