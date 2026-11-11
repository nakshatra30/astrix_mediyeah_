/** Admin session API (cookie-based, CSRF-protected writes). */

import { get, post } from "./client";
import type { AdminUser } from "./types";

export function login(email: string, password: string): Promise<AdminUser> {
  return post<AdminUser>("/auth/login", { email, password }).then((r) => r.data);
}

/** Bootstrap: verifies the session cookie and returns the CSRF token. */
export function me(): Promise<AdminUser & { csrfToken: string }> {
  return get<AdminUser & { csrfToken: string }>("/auth/me").then((r) => r.data);
}

export function logout(csrfToken: string): Promise<void> {
  return post<void>("/auth/logout", undefined, csrfToken).then(() => undefined);
}

export function changePassword(currentPassword: string, newPassword: string, csrfToken: string): Promise<void> {
  return post<void>("/auth/change-password", { currentPassword, newPassword }, csrfToken).then(() => undefined);
}
