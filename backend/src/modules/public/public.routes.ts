import { Router } from "express";
import { publicCreateEnquiry } from "../enquiries/enquiries.controller.js";
import { enquiryLimiter } from "../../middleware/rateLimiters.js";
import { publicGetHome } from "./public.controller.js";
import { publicGetProjectBySlug, publicListProjects } from "../projects/projects.controller.js";
import { publicGetServiceBySlug, publicListServices } from "../services/services.controller.js";
import { publicGetSettings } from "../settings/settings.controller.js";
import { publicListTestimonials } from "../testimonials/testimonials.controller.js";

/**
 * Public website API — read-only content + the enquiry contact form.
 * Reuses the existing public controllers; no admin auth, no CSRF (GETs and
 * the unauthenticated enquiry POST by design). The enquiry POST shares the
 * same per-IP enquiry rate limiter as POST /enquiries (same form, two paths).
 */
export const publicWebsiteRouter = Router();

publicWebsiteRouter.get("/home", publicGetHome);
publicWebsiteRouter.get("/services", publicListServices);
publicWebsiteRouter.get("/services/:slug", publicGetServiceBySlug);
publicWebsiteRouter.get("/projects", publicListProjects);
publicWebsiteRouter.get("/projects/:slug", publicGetProjectBySlug);
publicWebsiteRouter.get("/testimonials", publicListTestimonials);
publicWebsiteRouter.get("/site-settings", publicGetSettings);
publicWebsiteRouter.post("/enquiries", enquiryLimiter, publicCreateEnquiry);
