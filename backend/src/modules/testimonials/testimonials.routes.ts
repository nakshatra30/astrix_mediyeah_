import { Router } from "express";
import {
  adminCreateTestimonial,
  adminDeleteTestimonial,
  adminListTestimonials,
  adminUpdateTestimonial,
  publicListTestimonials,
} from "./testimonials.controller.js";
import { requireCsrf } from "../../middleware/requireCsrf.js";
import { requireAdmin } from "../../middleware/session.js";

export const publicTestimonialsRouter = Router();

publicTestimonialsRouter.get("/", publicListTestimonials);

export const adminTestimonialsRouter = Router();

adminTestimonialsRouter.get("/", requireAdmin, adminListTestimonials);
adminTestimonialsRouter.post("/", requireAdmin, requireCsrf, adminCreateTestimonial);
adminTestimonialsRouter.patch("/:id", requireAdmin, requireCsrf, adminUpdateTestimonial);
adminTestimonialsRouter.delete("/:id", requireAdmin, requireCsrf, adminDeleteTestimonial);
