import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,64}$/;

/** Attaches a per-request id (echoed in the X-Request-Id header and errors). */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header("x-request-id");
  const id = incoming !== undefined && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
  res.locals.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
}
