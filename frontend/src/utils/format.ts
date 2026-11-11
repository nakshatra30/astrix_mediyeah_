/** Formatting helpers and enum metadata. */

import type { Division, EnquiryStatus, PreferredContactMethod, ProjectStatus } from "../api/types";

const dateFmt = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => part !== "")
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Slugify — mirrors the backend slug rules for form helpers. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ---------- Enum metadata ---------- */

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; badge: string }> = {
  DRAFT: { label: "Draft", badge: "badge-neutral" },
  PUBLISHED: { label: "Published", badge: "badge-green" },
  ARCHIVED: { label: "Archived", badge: "badge-amber" },
};

export const ENQUIRY_STATUS_META: Record<EnquiryStatus, { label: string; badge: string }> = {
  NEW: { label: "New", badge: "badge-blue" },
  IN_PROGRESS: { label: "In progress", badge: "badge-violet" },
  CONTACTED: { label: "Contacted", badge: "badge-magenta" },
  CONVERTED: { label: "Converted", badge: "badge-green" },
  CLOSED: { label: "Closed", badge: "badge-neutral" },
  SPAM: { label: "Spam", badge: "badge-red" },
};

export const DIVISION_META: Record<Division, { label: string; short: string; badge: string }> = {
  TECHNOLOGY: { label: "Technology & Web Solutions", short: "Technology", badge: "badge-blue" },
  CREATIVE: { label: "Creative & Digital Growth", short: "Creative", badge: "badge-magenta" },
};

export const PREFERRED_CONTACT_LABELS: Record<PreferredContactMethod, string> = {
  EMAIL: "Email",
  PHONE: "Phone call",
  WHATSAPP: "WhatsApp",
};

export const ENQUIRY_STATUSES: EnquiryStatus[] = ["NEW", "IN_PROGRESS", "CONTACTED", "CONVERTED", "CLOSED", "SPAM"];
export const PROJECT_STATUSES: ProjectStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
export const DIVISIONS: Division[] = ["TECHNOLOGY", "CREATIVE"];

export const BUDGET_RANGES = [
  "Under ₹25,000",
  "₹25,000 – ₹75,000",
  "₹75,000 – ₹2,00,000",
  "₹2,00,000 – ₹5,00,000",
  "₹5,00,000+",
  "Not sure yet",
] as const;
