import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import * as adminApi from "../api/admin";
import { ApiError } from "../api/client";
import type {
  CategoryInput,
  Division,
  EnquiryStatus,
  ProjectInput,
  ServiceInput,
  TestimonialInput,
} from "../api/types";
import { useAuth } from "../auth/AuthContext";

/**
 * All admin mutations flow through here: the CSRF token is injected from the
 * session context, and a 401 (expired session) drops the local session so the
 * auth guard redirects to login instead of showing opaque errors.
 */
function useAdminMutation<TInput, TOutput>(
  fn: (input: TInput, csrf: string) => Promise<TOutput>,
  options?: Omit<UseMutationOptions<TOutput, Error, TInput>, "mutationFn">,
) {
  const { csrfToken, expire } = useAuth();
  return useMutation<TOutput, Error, TInput>({
    ...options,
    mutationFn: (input: TInput) => {
      if (csrfToken === null) return Promise.reject(new Error("Not authenticated"));
      return fn(input, csrfToken);
    },
    onError: (error, variables, context, mutation) => {
      if (error instanceof ApiError && error.status === 401) expire();
      options?.onError?.(error, variables, context, mutation);
    },
  });
}

export const adminKeys = {
  projects: (query: adminApi.AdminProjectQuery) => ["admin", "projects", query] as const,
  project: (id: string) => ["admin", "project", id] as const,
  categories: (division?: Division) => ["admin", "categories", division ?? "all"] as const,
  services: (division?: Division, isActive?: boolean) => ["admin", "services", division ?? "all", isActive ?? "any"] as const,
  testimonials: ["admin", "testimonials"] as const,
  enquiries: (status?: EnquiryStatus, page?: number) => ["admin", "enquiries", status ?? "all", page ?? 1] as const,
  enquiry: (id: string) => ["admin", "enquiry", id] as const,
  notes: (id: string) => ["admin", "enquiry-notes", id] as const,
  settings: ["admin", "site-settings"] as const,
  media: (page: number) => ["admin", "media", page] as const,
};

/* ---------- Queries ---------- */

export function useAdminProjects(query: adminApi.AdminProjectQuery) {
  return useQuery({ queryKey: adminKeys.projects(query), queryFn: ({ signal }) => adminApi.adminListProjects(query, signal) });
}

export function useAdminProject(id: string) {
  return useQuery({
    queryKey: adminKeys.project(id),
    queryFn: ({ signal }) => adminApi.adminGetProject(id, signal),
    enabled: id !== "",
  });
}

export function useAdminCategories(division?: Division) {
  return useQuery({ queryKey: adminKeys.categories(division), queryFn: ({ signal }) => adminApi.adminListCategories(division, signal) });
}

export function useAdminServices(division?: Division, isActive?: boolean) {
  return useQuery({ queryKey: adminKeys.services(division, isActive), queryFn: ({ signal }) => adminApi.adminListServices(division, isActive, signal) });
}

export function useAdminTestimonials() {
  return useQuery({ queryKey: adminKeys.testimonials, queryFn: ({ signal }) => adminApi.adminListTestimonials(signal) });
}

export function useAdminEnquiries(status: EnquiryStatus | undefined, page: number) {
  return useQuery({ queryKey: adminKeys.enquiries(status, page), queryFn: ({ signal }) => adminApi.adminListEnquiries(status, page, signal) });
}

export function useAdminEnquiry(id: string) {
  return useQuery({
    queryKey: adminKeys.enquiry(id),
    queryFn: ({ signal }) => adminApi.adminGetEnquiry(id, signal),
    enabled: id !== "",
  });
}

export function useAdminSettings() {
  return useQuery({ queryKey: adminKeys.settings, queryFn: ({ signal }) => adminApi.adminGetSettings(signal) });
}

export function useAdminMedia(page: number) {
  return useQuery({ queryKey: adminKeys.media(page), queryFn: ({ signal }) => adminApi.adminListMedia(page, signal) });
}

/* ---------- Projects mutations ---------- */

export function useCreateProject() {
  const client = useQueryClient();
  return useAdminMutation(adminApi.adminCreateProject, {
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["admin", "projects"] });
    },
  });
}

export function useUpdateProject() {
  const client = useQueryClient();
  return useAdminMutation(
    ({ id, input }: { id: string; input: Partial<ProjectInput> }, csrf: string) =>
      adminApi.adminUpdateProject(id, input, csrf),
    {
      onSuccess: (_data, variables) => {
        void client.invalidateQueries({ queryKey: ["admin", "projects"] });
        void client.invalidateQueries({ queryKey: adminKeys.project(variables.id) });
      },
    },
  );
}

export function useArchiveProject() {
  const client = useQueryClient();
  return useAdminMutation(adminApi.adminArchiveProject, {
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["admin", "projects"] });
    },
  });
}

/* ---------- Categories ---------- */

export function useCreateCategory() {
  const client = useQueryClient();
  return useAdminMutation(adminApi.adminCreateCategory, {
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });
}

export function useUpdateCategory() {
  const client = useQueryClient();
  return useAdminMutation(
    ({ id, input }: { id: string; input: Partial<CategoryInput> }, csrf: string) =>
      adminApi.adminUpdateCategory(id, input, csrf),
    {
      onSuccess: () => {
        void client.invalidateQueries({ queryKey: ["admin", "categories"] });
      },
    },
  );
}

export function useDeleteCategory() {
  const client = useQueryClient();
  return useAdminMutation(adminApi.adminDeleteCategory, {
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });
}

/* ---------- Services ---------- */

export function useCreateService() {
  const client = useQueryClient();
  return useAdminMutation(adminApi.adminCreateService, {
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["admin", "services"] });
    },
  });
}

export function useUpdateService() {
  const client = useQueryClient();
  return useAdminMutation(
    ({ id, input }: { id: string; input: Partial<ServiceInput> }, csrf: string) =>
      adminApi.adminUpdateService(id, input, csrf),
    {
      onSuccess: () => {
        void client.invalidateQueries({ queryKey: ["admin", "services"] });
      },
    },
  );
}

export function useDeleteService() {
  const client = useQueryClient();
  return useAdminMutation(adminApi.adminDeleteService, {
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["admin", "services"] });
    },
  });
}

/* ---------- Testimonials ---------- */

export function useCreateTestimonial() {
  const client = useQueryClient();
  return useAdminMutation(adminApi.adminCreateTestimonial, {
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: adminKeys.testimonials });
    },
  });
}

export function useUpdateTestimonial() {
  const client = useQueryClient();
  return useAdminMutation(
    ({ id, input }: { id: string; input: Partial<TestimonialInput> }, csrf: string) =>
      adminApi.adminUpdateTestimonial(id, input, csrf),
    {
      onSuccess: () => {
        void client.invalidateQueries({ queryKey: adminKeys.testimonials });
      },
    },
  );
}

export function useDeleteTestimonial() {
  const client = useQueryClient();
  return useAdminMutation(adminApi.adminDeleteTestimonial, {
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: adminKeys.testimonials });
    },
  });
}

/* ---------- Enquiries ---------- */

export function useUpdateEnquiryStatus() {
  const client = useQueryClient();
  return useAdminMutation(
    ({ id, status }: { id: string; status: EnquiryStatus }, csrf: string) =>
      adminApi.adminUpdateEnquiryStatus(id, status, csrf),
    {
      onSuccess: (_data, variables) => {
        void client.invalidateQueries({ queryKey: ["admin", "enquiries"] });
        void client.invalidateQueries({ queryKey: adminKeys.enquiry(variables.id) });
      },
    },
  );
}

export function useCreateEnquiryNote() {
  const client = useQueryClient();
  return useAdminMutation(
    ({ id, body }: { id: string; body: string }, csrf: string) => adminApi.adminCreateEnquiryNote(id, body, csrf),
    {
      onSuccess: (_data, variables) => {
        void client.invalidateQueries({ queryKey: ["admin", "enquiries"] });
        void client.invalidateQueries({ queryKey: adminKeys.enquiry(variables.id) });
        void client.invalidateQueries({ queryKey: adminKeys.notes(variables.id) });
      },
    },
  );
}

/* ---------- Settings ---------- */

export function useUpdateSettings() {
  const client = useQueryClient();
  return useAdminMutation(adminApi.adminUpdateSettings, {
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: adminKeys.settings });
      void client.invalidateQueries({ queryKey: ["public"] });
    },
  });
}

/* ---------- Media ---------- */

export function useUploadMedia() {
  const client = useQueryClient();
  return useAdminMutation(adminApi.adminUploadMedia, {
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["admin", "media"] });
    },
  });
}

export function useDeleteMedia() {
  const client = useQueryClient();
  return useAdminMutation(adminApi.adminDeleteMedia, {
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["admin", "media"] });
    },
  });
}
