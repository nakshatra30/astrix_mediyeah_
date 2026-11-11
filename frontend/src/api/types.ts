/** Shared API types — mirror the backend Prisma models and route payloads. */

export type Division = "TECHNOLOGY" | "CREATIVE";
export type ProjectStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type EnquiryStatus = "NEW" | "IN_PROGRESS" | "CONTACTED" | "CONVERTED" | "CLOSED" | "SPAM";
export type PreferredContactMethod = "EMAIL" | "PHONE" | "WHATSAPP";

export const DIVISION_LABELS: Record<Division, string> = {
  TECHNOLOGY: "Technology & Web",
  CREATIVE: "Creative & Growth",
};

export interface Meta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Paginated<T> {
  data: T[];
  /** Present on list endpoints; consumers must treat it as possibly missing. */
  meta?: Meta;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  division: Division;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  division: Division;
  shortDescription: string | null;
  description: string | null;
  deliverables: string[];
  iconKey: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  publicId: string;
  url: string;
  secureUrl: string;
  mimeType: string;
  byteSize: number;
  width: number;
  height: number;
  storage: "cloudinary" | "local";
  createdAt: string;
}

export interface ProjectImage {
  id: string;
  altText: string | null;
  displayOrder: number;
  mediaAsset: Pick<MediaAsset, "id" | "url" | "filename">;
}

/** Project as returned by public/admin list endpoints (category included, no images). */
export interface ProjectSummary {
  id: string;
  title: string;
  slug: string;
  division: Division;
  shortDescription: string | null;
  technologies: string[];
  projectUrl: string | null;
  repositoryUrl: string | null;
  isFeatured: boolean;
  status: ProjectStatus;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  _count?: { images: number };
  createdAt: string;
  updatedAt: string;
}

/** Project detail (public/:slug or admin/:id) — includes images. */
export interface ProjectDetail extends ProjectSummary {
  fullDescription: string | null;
  challenge: string | null;
  solution: string | null;
  process: string | null;
  images: ProjectImage[];
}

export interface HomeFeaturedProject extends ProjectSummary {
  thumbnail: string | null;
  thumbnailAltText: string | null;
}

export interface Testimonial {
  id: string;
  clientName: string;
  designation: string | null;
  companyName: string | null;
  quote: string;
  rating: number;
  isPublished: boolean;
  displayOrder: number;
  avatarMediaAssetId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  id: string;
  agencyName: string | null;
  tagline: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  aboutIntro: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  whatsappNumber: string | null;
  address: string | null;
  socialInstagram: string | null;
  socialLinkedIn: string | null;
  socialX: string | null;
  socialFacebook: string | null;
  socialYoutube: string | null;
  footerText: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
}

/** GET /public/home aggregate payload. */
export interface HomePayload {
  agency: { name: string | null; tagline: string | null };
  hero: { title: string | null; subtitle: string | null };
  about: { intro: string | null };
  services: { featured: Array<Pick<Service, "id" | "title" | "slug" | "division" | "shortDescription" | "iconKey" | "displayOrder">> };
  projects: { featured: HomeFeaturedProject[] };
  testimonials: { approved: Array<Pick<Testimonial, "id" | "clientName" | "designation" | "companyName" | "quote" | "rating" | "displayOrder">> };
  contact: { email: string | null; phone: string | null; whatsapp: string | null; address: string | null };
  social: {
    instagram: string | null;
    linkedin: string | null;
    x: string | null;
    facebook: string | null;
    youtube: string | null;
  };
  seo: { title: string | null; description: string | null };
}

export interface EnquirySummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  serviceId: string | null;
  serviceNameSnapshot: string | null;
  budgetRange: string | null;
  preferredContactMethod: PreferredContactMethod | null;
  projectDescription: string;
  sourcePage: string | null;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryDetail extends EnquirySummary {
  service: { id: string; title: string; slug: string } | null;
  notes: EnquiryNote[];
  _count?: { notes: number };
}

export interface EnquiryNote {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  lastLoginAt?: string | null;
  csrfToken?: string;
}

/* ---------- Payload types (forms) ---------- */

export interface EnquiryInput {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  serviceId?: string | null;
  budgetRange?: string | null;
  preferredContactMethod?: PreferredContactMethod | null;
  projectDescription: string;
  privacyConsent: boolean;
  sourcePage?: string | null;
}

export interface ProjectInput {
  title: string;
  slug: string;
  division: Division;
  categoryId?: string | null;
  shortDescription?: string | null;
  fullDescription?: string | null;
  challenge?: string | null;
  solution?: string | null;
  process?: string | null;
  technologies: string[];
  projectUrl?: string | null;
  repositoryUrl?: string | null;
  isFeatured: boolean;
  status: ProjectStatus;
}

export interface ServiceInput {
  title: string;
  slug: string;
  division: Division;
  shortDescription?: string | null;
  description?: string | null;
  deliverables: string[];
  iconKey?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface CategoryInput {
  name: string;
  slug: string;
  division: Division;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface TestimonialInput {
  clientName: string;
  designation?: string | null;
  companyName?: string | null;
  quote: string;
  rating: number;
  isPublished: boolean;
  displayOrder: number;
  avatarMediaAssetId?: string | null;
}

export interface SettingsInput {
  agencyName?: string | null;
  tagline?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  aboutIntro?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  whatsappNumber?: string | null;
  address?: string | null;
  socialInstagram?: string | null;
  socialLinkedIn?: string | null;
  socialX?: string | null;
  socialFacebook?: string | null;
  socialYoutube?: string | null;
  footerText?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}
