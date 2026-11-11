/** Authenticated admin CRUD API. All state-changing calls require the CSRF token. */

import { del, get, getPaginated, patch, post, upload } from "./client";
import type {
  Category,
  CategoryInput,
  Division,
  EnquiryDetail,
  EnquiryNote,
  EnquiryStatus,
  EnquirySummary,
  MediaAsset,
  Paginated,
  ProjectDetail,
  ProjectInput,
  ProjectStatus,
  ProjectSummary,
  Service,
  ServiceInput,
  SiteSettings,
  SettingsInput,
  Testimonial,
  TestimonialInput,
} from "./types";

/* ---------- Projects ---------- */

export interface AdminProjectQuery {
  page?: number;
  pageSize?: number;
  status?: ProjectStatus;
  division?: Division;
  sort?: "newest" | "oldest";
}

export function adminListProjects(query: AdminProjectQuery = {}, signal?: AbortSignal): Promise<Paginated<ProjectSummary>> {
  const qs = new URLSearchParams();
  if (query.page !== undefined) qs.set("page", String(query.page));
  if (query.pageSize !== undefined) qs.set("pageSize", String(query.pageSize));
  if (query.status !== undefined) qs.set("status", query.status);
  if (query.division !== undefined) qs.set("division", query.division);
  if (query.sort !== undefined) qs.set("sort", query.sort);
  const suffix = qs.toString();
  return getPaginated<ProjectSummary>(suffix === "" ? "/admin/projects" : `/admin/projects?${suffix}`, signal);
}

export function adminGetProject(id: string, signal?: AbortSignal): Promise<ProjectDetail> {
  return get<ProjectDetail>(`/admin/projects/${id}`, signal).then((r) => r.data);
}

export function adminCreateProject(input: ProjectInput, csrf: string): Promise<ProjectDetail> {
  return post<ProjectDetail>("/admin/projects", input, csrf).then((r) => r.data);
}

export function adminUpdateProject(id: string, input: Partial<ProjectInput>, csrf: string): Promise<ProjectDetail> {
  return patch<ProjectDetail>(`/admin/projects/${id}`, input, csrf).then((r) => r.data);
}

export function adminArchiveProject(id: string, csrf: string): Promise<ProjectDetail> {
  return del<ProjectDetail>(`/admin/projects/${id}`, csrf).then((r) => r.data);
}

/* ---------- Categories ---------- */

export function adminListCategories(division?: Division, signal?: AbortSignal): Promise<Paginated<Category>> {
  const path = division === undefined ? "/admin/categories" : `/admin/categories?division=${division}`;
  return getPaginated<Category>(path, signal);
}

export function adminCreateCategory(input: CategoryInput, csrf: string): Promise<Category> {
  return post<Category>("/admin/categories", input, csrf).then((r) => r.data);
}

export function adminUpdateCategory(id: string, input: Partial<CategoryInput>, csrf: string): Promise<Category> {
  return patch<Category>(`/admin/categories/${id}`, input, csrf).then((r) => r.data);
}

export function adminDeleteCategory(id: string, csrf: string): Promise<Category> {
  return del<Category>(`/admin/categories/${id}`, csrf).then((r) => r.data);
}

/* ---------- Services ---------- */

export function adminListServices(division?: Division, isActive?: boolean, signal?: AbortSignal): Promise<Paginated<Service>> {
  const params: string[] = [];
  if (division !== undefined) params.push(`division=${division}`);
  if (isActive !== undefined) params.push(`isActive=${isActive}`);
  const query = params.length > 0 ? `?${params.join("&")}` : "";
  return getPaginated<Service>(`/admin/services${query}`, signal);
}

export function adminCreateService(input: ServiceInput, csrf: string): Promise<Service> {
  return post<Service>("/admin/services", input, csrf).then((r) => r.data);
}

export function adminUpdateService(id: string, input: Partial<ServiceInput>, csrf: string): Promise<Service> {
  return patch<Service>(`/admin/services/${id}`, input, csrf).then((r) => r.data);
}

export function adminDeleteService(id: string, csrf: string): Promise<Service> {
  return del<Service>(`/admin/services/${id}`, csrf).then((r) => r.data);
}

/* ---------- Testimonials ---------- */

export function adminListTestimonials(signal?: AbortSignal): Promise<Paginated<Testimonial>> {
  return getPaginated<Testimonial>("/admin/testimonials", signal);
}

export function adminCreateTestimonial(input: TestimonialInput, csrf: string): Promise<Testimonial> {
  return post<Testimonial>("/admin/testimonials", input, csrf).then((r) => r.data);
}

export function adminUpdateTestimonial(id: string, input: Partial<TestimonialInput>, csrf: string): Promise<Testimonial> {
  return patch<Testimonial>(`/admin/testimonials/${id}`, input, csrf).then((r) => r.data);
}

export function adminDeleteTestimonial(id: string, csrf: string): Promise<Testimonial> {
  return del<Testimonial>(`/admin/testimonials/${id}`, csrf).then((r) => r.data);
}

/* ---------- Enquiries ---------- */

export function adminListEnquiries(status?: EnquiryStatus, page = 1, signal?: AbortSignal): Promise<Paginated<EnquirySummary>> {
  const qs = new URLSearchParams({ page: String(page) });
  if (status !== undefined) qs.set("status", status);
  return getPaginated<EnquirySummary>(`/admin/enquiries?${qs.toString()}`, signal);
}

export function adminGetEnquiry(id: string, signal?: AbortSignal): Promise<EnquiryDetail> {
  return get<EnquiryDetail>(`/admin/enquiries/${id}`, signal).then((r) => r.data);
}

export function adminUpdateEnquiryStatus(id: string, status: EnquiryStatus, csrf: string): Promise<EnquirySummary> {
  return patch<EnquirySummary>(`/admin/enquiries/${id}`, { status }, csrf).then((r) => r.data);
}

export function adminListEnquiryNotes(id: string, signal?: AbortSignal): Promise<EnquiryNote[]> {
  return get<EnquiryNote[]>(`/admin/enquiries/${id}/notes`, signal).then((r) => r.data);
}

export function adminCreateEnquiryNote(id: string, body: string, csrf: string): Promise<EnquiryNote> {
  return post<EnquiryNote>(`/admin/enquiries/${id}/notes`, { body }, csrf).then((r) => r.data);
}

/* ---------- Site settings ---------- */

export function adminGetSettings(signal?: AbortSignal): Promise<SiteSettings> {
  return get<SiteSettings>("/admin/site-settings", signal).then((r) => r.data);
}

export function adminUpdateSettings(input: SettingsInput, csrf: string): Promise<SiteSettings> {
  return patch<SiteSettings>("/admin/site-settings", input, csrf).then((r) => r.data);
}

/* ---------- Media ---------- */

export function adminListMedia(page = 1, signal?: AbortSignal): Promise<Paginated<MediaAsset>> {
  return getPaginated<MediaAsset>(`/admin/media?page=${page}`, signal);
}

export function adminUploadMedia(file: File, csrf: string): Promise<MediaAsset> {
  const formData = new FormData();
  formData.append("file", file);
  return upload<MediaAsset>("/admin/media", formData, csrf).then((r) => r.data);
}

export function adminDeleteMedia(id: string, csrf: string): Promise<MediaAsset> {
  return del<MediaAsset>(`/admin/media/${id}`, csrf).then((r) => r.data);
}
