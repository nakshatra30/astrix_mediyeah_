import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api.js";

function tokensMatch(expected: string, received: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * CSRF defense for cookie-authenticated state-changing requests: requires
 * the X-CSRF-Token header to equal the session's token (constant-time).
 * Must run after requireAdmin.
 */
export function requireCsrf(req: Request, res: Response, next: NextFunction): void {
  const expected = res.locals.adminCsrfToken;
  const received = req.header("x-csrf-token");
  if (typeof expected !== "string" || typeof received !== "string" || !tokensMatch(expected, received)) {
    next(new ApiError(403, "FORBIDDEN", "Invalid or missing CSRF token"));
    return;
  }
  next();
}
