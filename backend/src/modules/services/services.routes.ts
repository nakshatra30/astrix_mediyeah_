import { Router } from "express";
import {
  adminCreateService,
  adminDeactivateService,
  adminGetService,
  adminListServices,
  adminUpdateService,
  publicGetServiceBySlug,
  publicListServices,
} from "./services.controller.js";
import { requireCsrf } from "../../middleware/requireCsrf.js";
import { requireAdmin } from "../../middleware/session.js";

export const publicServicesRouter = Router();

publicServicesRouter.get("/", publicListServices);
publicServicesRouter.get("/:slug", publicGetServiceBySlug);

export const adminServicesRouter = Router();

adminServicesRouter.get("/", requireAdmin, adminListServices);
adminServicesRouter.get("/:id", requireAdmin, adminGetService);
adminServicesRouter.post("/", requireAdmin, requireCsrf, adminCreateService);
adminServicesRouter.patch("/:id", requireAdmin, requireCsrf, adminUpdateService);
adminServicesRouter.delete("/:id", requireAdmin, requireCsrf, adminDeactivateService);
