import { Router } from "express";
import { adminUpdateSettings, publicGetSettings } from "./settings.controller.js";
import { requireCsrf } from "../../middleware/requireCsrf.js";
import { requireAdmin } from "../../middleware/session.js";

export const publicSettingsRouter = Router();

publicSettingsRouter.get("/", publicGetSettings);

export const adminSettingsRouter = Router();

adminSettingsRouter.get("/", requireAdmin, publicGetSettings);
adminSettingsRouter.patch("/", requireAdmin, requireCsrf, adminUpdateSettings);
