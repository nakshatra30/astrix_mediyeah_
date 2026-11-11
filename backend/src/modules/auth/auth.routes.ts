import { Router } from "express";
import { changePassword, login, logout, me } from "./auth.controller.js";
import { requireCsrf } from "../../middleware/requireCsrf.js";
import { requireAdmin } from "../../middleware/session.js";
import { loginLimiter } from "../../middleware/rateLimiters.js";

export const adminAuthRouter = Router();

adminAuthRouter.post("/login", loginLimiter, login);
adminAuthRouter.post("/logout", requireAdmin, requireCsrf, logout);
adminAuthRouter.get("/me", requireAdmin, me);
adminAuthRouter.post("/change-password", requireAdmin, requireCsrf, changePassword);
