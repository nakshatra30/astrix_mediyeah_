/**
 * API client — unwraps the backend's { data } / { data, meta } envelopes,
 * normalizes errors, and retries idempotent GETs once on 5xx so the first
 * request after a Neon compute cold start doesn't surface as a failure.
 */

import type { Paginated } from "./types";

/* The API is always reached with a relative path: in production the
   platform routes /api/* to the backend service, and in development the
   Vite dev server proxies /api to the local backend (see vite.config.ts).
   VITE_API_URL overrides either when set. */
const fallbackApiUrl = "/api/v1";

export const API_URL = import.meta.env.VITE_API_URL ?? fallbackApiUrl;

export interface ApiErrorShape {
  code: string;
  message: string;
  requestId?: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(status: number, shape: ApiErrorShape | string) {
    super(typeof shape === "string" ? shape : shape.message);
    this.name = "ApiError";
    this.status = status;
    this.code = typeof shape === "string" ? "UNKNOWN" : shape.code;
    this.requestId = typeof shape === "string" ? undefined : shape.requestId;
    this.details = typeof shape === "string" ? undefined : shape.details;
  }
}

export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super(cause instanceof Error ? `Network error: ${cause.message}` : "Network error");
    this.name = "NetworkError";
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  formData?: FormData;
  signal?: AbortSignal;
  /** CSRF token — required for state-changing authenticated requests. */
  csrfToken?: string;
  /** Retry idempotent requests on 5xx (default: GET only). */
  retryOn5xx?: boolean;
}

interface Envelope<T> {
  data?: T;
  meta?: unknown;
  error?: ApiErrorShape;
}

export interface Result<T> {
  data: T;
  meta?: MetaLike;
}

export interface MetaLike {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

async function once<T>(path: string, options: RequestOptions): Promise<Result<T>> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {};

  if (options.csrfToken !== undefined) {
    headers["X-CSRF-Token"] = options.csrfToken;
  }

  let body: BodyInit | undefined;
  if (options.formData !== undefined) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body,
      credentials: "include",
      signal: options.signal,
    });
  } catch (error) {
    throw new NetworkError(error);
  }

  // 204 (logout) has no body.
  if (res.status === 204) {
    return { data: undefined as T };
  }

  let payload: Envelope<T> | null = null;
  const text = await res.text();
  if (text !== "") {
    try {
      payload = JSON.parse(text) as Envelope<T>;
    } catch {
      // Non-JSON body — treat as opaque failure below.
    }
  }

  if (!res.ok) {
    const shape = payload?.error;
    if (shape !== undefined) {
      throw new ApiError(res.status, shape);
    }
    throw new ApiError(res.status, {
      code: `HTTP_${res.status}`,
      message: `Request failed with status ${res.status}`,
    });
  }

  // Some endpoints (PATCH /admin/site-settings) return the resource bare.
  if (payload !== null && payload.data !== undefined) {
    return { data: payload.data, meta: payload.meta as MetaLike | undefined };
  }
  return { data: payload as unknown as T };
}

const RETRYABLE_METHODS = new Set(["GET"]);

/** Fetch with a single retry for GETs that hit a cold compute (5xx). */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<Result<T>> {
  const retry = options.retryOn5xx ?? true;
  try {
    return await once<T>(path, options);
  } catch (error) {
    const retryable =
      retry &&
      RETRYABLE_METHODS.has(options.method ?? "GET") &&
      error instanceof ApiError &&
      error.status >= 500;
    if (!retryable) throw error;
    await new Promise((resolve) => setTimeout(resolve, 900));
    return once<T>(path, options);
  }
}

/* ---------- Typed helpers ---------- */

export function get<T>(path: string, signal?: AbortSignal): Promise<Result<T>> {
  return request<T>(path, { signal });
}

/**
 * GET a paginated list endpoint. The backend envelope is { data: T[], meta },
 * which `request` splits into Result<T[]> — this re-composes it so callers
 * receive the full Paginated<T> shape (array + page metadata) instead of the
 * bare array.
 */
export async function getPaginated<T>(path: string, signal?: AbortSignal): Promise<Paginated<T>> {
  const result = await request<T[]>(path, { signal });
  return { data: result.data, meta: result.meta };
}

export function post<T>(path: string, body?: unknown, csrfToken?: string): Promise<Result<T>> {
  return request<T>(path, { method: "POST", body, csrfToken });
}

export function patch<T>(path: string, body?: unknown, csrfToken?: string): Promise<Result<T>> {
  return request<T>(path, { method: "PATCH", body, csrfToken });
}

export function del<T>(path: string, csrfToken?: string): Promise<Result<T>> {
  return request<T>(path, { method: "DELETE", csrfToken });
}

export function upload<T>(path: string, formData: FormData, csrfToken?: string): Promise<Result<T>> {
  return request<T>(path, { method: "POST", formData, csrfToken });
}

/** Human-friendly message for any thrown API/network error. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return "Too many requests — please wait a moment and try again.";
    }
    if (error.status === 401) {
      return "Your session has expired. Please sign in again.";
    }
    return error.message;
  }
  if (error instanceof NetworkError) {
    return "Cannot reach the server. Please check your connection and try again.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
