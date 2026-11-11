/** Public (unauthenticated) website API. */

import { get, getPaginated, post } from "./client";
import type {
  Category,
  EnquiryInput,
  EnquirySummary,
  HomePayload,
  Paginated,
  ProjectDetail,
  ProjectSummary,
  Service,
  SiteSettings,
  Testimonial,
} from "./types";

export function getHome(signal?: AbortSignal): Promise<HomePayload> {
  return get<HomePayload>("/public/home", signal).then((r) => r.data);
}

export interface ProjectListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  featured?: boolean;
  division?: "TECHNOLOGY" | "CREATIVE";
  sort?: "newest" | "oldest";
}

export function listProjects(params: ProjectListParams = {}, signal?: AbortSignal): Promise<Paginated<ProjectSummary>> {
  const qs = new URLSearchParams();
  if (params.page !== undefined) qs.set("page", String(params.page));
  if (params.pageSize !== undefined) qs.set("pageSize", String(params.pageSize));
  if (params.search !== undefined && params.search !== "") qs.set("search", params.search);
  if (params.category !== undefined && params.category !== "") qs.set("category", params.category);
  if (params.featured !== undefined) qs.set("featured", params.featured ? "true" : "false");
  if (params.division !== undefined) qs.set("division", params.division);
  if (params.sort !== undefined) qs.set("sort", params.sort);
  const suffix = qs.toString();
  const path = suffix === "" ? "/public/projects" : `/public/projects?${suffix}`;
  return getPaginated<ProjectSummary>(path, signal);
}

export function getProject(slug: string, signal?: AbortSignal): Promise<ProjectDetail> {
  return get<ProjectDetail>(`/public/projects/${encodeURIComponent(slug)}`, signal).then((r) => r.data);
}

export function listServices(
  division?: "TECHNOLOGY" | "CREATIVE",
  signal?: AbortSignal,
): Promise<Paginated<Service>> {
  const path = division === undefined ? "/public/services" : `/public/services?division=${division}`;
  return getPaginated<Service>(path, signal);
}

export function getService(slug: string, signal?: AbortSignal): Promise<Service> {
  return get<Service>(`/public/services/${encodeURIComponent(slug)}`, signal).then((r) => r.data);
}

export function listCategories(division?: "TECHNOLOGY" | "CREATIVE", signal?: AbortSignal): Promise<Paginated<Category>> {
  // Route contract (Bruno collection + backend router): public categories live
  // at /categories, NOT under /public (that path 404s).
  const path = division === undefined ? "/categories" : `/categories?division=${division}`;
  return getPaginated<Category>(path, signal);
}

export function listTestimonials(signal?: AbortSignal): Promise<Paginated<Testimonial>> {
  return getPaginated<Testimonial>("/public/testimonials", signal);
}

export function getSiteSettings(signal?: AbortSignal): Promise<SiteSettings> {
  return get<SiteSettings>("/public/site-settings", signal).then((r) => r.data);
}

export function submitEnquiry(input: EnquiryInput): Promise<EnquirySummary> {
  return post<EnquirySummary>("/public/enquiries", input).then((r) => r.data);
}
