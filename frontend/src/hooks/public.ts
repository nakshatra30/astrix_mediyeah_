import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import * as publicApi from "../api/public";
import type { EnquiryInput } from "../api/types";

export const publicKeys = {
  home: ["public", "home"] as const,
  projects: (params: publicApi.ProjectListParams) => ["public", "projects", params] as const,
  project: (slug: string) => ["public", "project", slug] as const,
  services: (division?: "TECHNOLOGY" | "CREATIVE") => ["public", "services", division ?? "all"] as const,
  service: (slug: string) => ["public", "service", slug] as const,
  categories: (division?: "TECHNOLOGY" | "CREATIVE") => ["public", "categories", division ?? "all"] as const,
  testimonials: ["public", "testimonials"] as const,
  settings: ["public", "site-settings"] as const,
};

export function useHome() {
  return useQuery({ queryKey: publicKeys.home, queryFn: ({ signal }) => publicApi.getHome(signal) });
}

export function useProjects(params: publicApi.ProjectListParams) {
  return useQuery({
    queryKey: publicKeys.projects(params),
    queryFn: ({ signal }) => publicApi.listProjects(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useProject(slug: string) {
  return useQuery({
    queryKey: publicKeys.project(slug),
    queryFn: ({ signal }) => publicApi.getProject(slug, signal),
  });
}

export function useServices(division?: "TECHNOLOGY" | "CREATIVE") {
  return useQuery({
    queryKey: publicKeys.services(division),
    queryFn: ({ signal }) => publicApi.listServices(division, signal),
    placeholderData: keepPreviousData,
  });
}

export function useService(slug: string) {
  return useQuery({
    queryKey: publicKeys.service(slug),
    queryFn: ({ signal }) => publicApi.getService(slug, signal),
  });
}

export function useCategories(division?: "TECHNOLOGY" | "CREATIVE") {
  return useQuery({
    queryKey: publicKeys.categories(division),
    queryFn: ({ signal }) => publicApi.listCategories(division, signal),
  });
}

export function useTestimonials() {
  return useQuery({ queryKey: publicKeys.testimonials, queryFn: ({ signal }) => publicApi.listTestimonials(signal) });
}

export function useSiteSettings() {
  return useQuery({ queryKey: publicKeys.settings, queryFn: ({ signal }) => publicApi.getSiteSettings(signal) });
}

export function useSubmitEnquiry() {
  return useMutation({ mutationFn: (input: EnquiryInput) => publicApi.submitEnquiry(input) });
}
