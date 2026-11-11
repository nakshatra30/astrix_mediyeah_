import { MulterError } from "multer";
import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api.js";

interface HttpErrorLike {
  status?: number;
  statusCode?: number;
  type?: string;
  message?: string;
  expose?: boolean;
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      requestId: res.locals.requestId,
    },
  });
}

function errorBody(requestId: unknown, code: string, message: string, details?: unknown) {
  const error: Record<string, unknown> = { code, message, requestId };
  if (details !== undefined) error.details = details;
  return { error };
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  const requestId = res.locals.requestId;

  // Zod validation failures (all request parsing funnels through zod).
  if (err instanceof Error && err.name === "ZodError") {
    const issues = (err as unknown as { issues: Array<{ path: Array<string | number | symbol>; message: string }> }).issues;
    res
      .status(400)
      .json(errorBody(requestId, "VALIDATION_ERROR", "Request validation failed", formatZodIssues(issues)));
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json(errorBody(requestId, err.code, err.message, err.details));
    return;
  }

  // Malformed / oversized JSON bodies from express.json.
  if (err instanceof SyntaxError) {
    const status = (err as HttpErrorLike).status;
    if (status === 400) {
      res.status(400).json(errorBody(requestId, "VALIDATION_ERROR", "Malformed JSON body"));
      return;
    }
  }
  const httpErr = err as HttpErrorLike;
  if (httpErr?.type === "entity.too.large") {
    res.status(413).json(errorBody(requestId, "PAYLOAD_TOO_LARGE", "Request body exceeds the 1 MB limit"));
    return;
  }

  // Multer upload errors (e.g. file size limit).
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json(errorBody(requestId, "PAYLOAD_TOO_LARGE", "Uploaded file exceeds the 5 MB limit"));
      return;
    }
    res.status(400).json(errorBody(requestId, "VALIDATION_ERROR", `Upload error: ${err.code}`));
    return;
  }

  // Prisma known request errors.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json(errorBody(requestId, "CONFLICT", "A record with this value already exists"));
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json(errorBody(requestId, "NOT_FOUND", "Record not found"));
      return;
    }
    if (err.code === "P2003") {
      res.status(409).json(errorBody(requestId, "CONFLICT", "Record is referenced by other records and cannot be changed"));
      return;
    }
  }

  // Unexpected errors: log server-side, never leak internals to the client.
  if (!env.isTest) {
    console.error(`[error] ${req.method} ${req.originalUrl} requestId=${requestId}`, err);
  }
  res.status(500).json(errorBody(requestId, "INTERNAL_ERROR", "Internal server error"));
}

function formatZodIssues(issues: Array<{ path: Array<string | number | symbol>; message: string }>) {
  return issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    message: issue.message,
  }));
}
