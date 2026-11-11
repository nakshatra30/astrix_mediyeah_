import { Router } from "express";
import {
  adminArchiveProject,
  adminCreateProject,
  adminGetProject,
  adminListProjects,
  adminUpdateProject,
  publicGetProjectBySlug,
  publicListProjects,
} from "./projects.controller.js";
import { requireCsrf } from "../../middleware/requireCsrf.js";
import { requireAdmin } from "../../middleware/session.js";

export const publicProjectsRouter = Router();

publicProjectsRouter.get("/", publicListProjects);
publicProjectsRouter.get("/:slug", publicGetProjectBySlug);

export const adminProjectsRouter = Router();

adminProjectsRouter.get("/", requireAdmin, adminListProjects);
adminProjectsRouter.get("/:id", requireAdmin, adminGetProject);
adminProjectsRouter.post("/", requireAdmin, requireCsrf, adminCreateProject);
adminProjectsRouter.patch("/:id", requireAdmin, requireCsrf, adminUpdateProject);
adminProjectsRouter.delete("/:id", requireAdmin, requireCsrf, adminArchiveProject);
