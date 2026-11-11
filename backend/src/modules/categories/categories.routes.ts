import { Router } from "express";
import {
  adminCreateCategory,
  adminDeactivateCategory,
  adminListCategories,
  adminUpdateCategory,
  publicListCategories,
} from "./categories.controller.js";
import { requireCsrf } from "../../middleware/requireCsrf.js";
import { requireAdmin } from "../../middleware/session.js";

export const publicCategoriesRouter = Router();

publicCategoriesRouter.get("/", publicListCategories);

export const adminCategoriesRouter = Router();

adminCategoriesRouter.get("/", requireAdmin, adminListCategories);
adminCategoriesRouter.post("/", requireAdmin, requireCsrf, adminCreateCategory);
adminCategoriesRouter.patch("/:id", requireAdmin, requireCsrf, adminUpdateCategory);
adminCategoriesRouter.delete("/:id", requireAdmin, requireCsrf, adminDeactivateCategory);
