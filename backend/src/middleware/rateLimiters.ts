import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

function rateLimited(_req: Request, res: Response, message: string): void {
  res.status(429).json({
    error: {
      code: "RATE_LIMITED",
      message,
      requestId: res.locals.requestId,
    },
  });
}

/** Global per-IP limiter for all /api/v1 routes. */
export const globalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) => rateLimited(req, res, "Too many requests, please slow down"),
});

/** Per-IP limiter for admin login — 10 failed attempts per 15 minutes. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) => rateLimited(req, res, "Too many login attempts, please try again later"),
});

/** Per-IP limiter for the public enquiry form — 10 submissions per 15 minutes. */
export const enquiryLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) => rateLimited(req, res, "Too many enquiries from this address, please try again later"),
});
