import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api.js";

export function sessionTtlMs(): number {
  return env.sessionTtlHours * 60 * 60 * 1000;
}

/**
 * Guards admin routes: resolves the HttpOnly session cookie to a valid,
 * unexpired AdminSession, refreshes it with a sliding expiry, and exposes
 * the session's CSRF token for the requireCsrf middleware.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = req.cookies?.[env.sessionCookieName];
    if (typeof sessionId !== "string" || sessionId === "") {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
    }

    const session = await prisma.adminSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (session === null || session.expiresAt.getTime() <= Date.now()) {
      if (session !== null) {
        await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => undefined);
      }
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
    }

    // Sliding expiration: extend only when meaningfully stale data would be
    // written otherwise (single update per request at most).
    const refreshedExpiry = new Date(Date.now() + sessionTtlMs());
    if (refreshedExpiry.getTime() - session.expiresAt.getTime() > 60_000) {
      await prisma.adminSession
        .update({ where: { id: session.id }, data: { expiresAt: refreshedExpiry } })
        .catch(() => undefined);
    }

    res.locals.adminUserId = session.user.id;
    res.locals.adminCsrfToken = session.csrfToken;
    next();
  } catch (err) {
    next(err);
  }
}
