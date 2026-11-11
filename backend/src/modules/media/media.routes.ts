import { Router } from "express";
import { deleteMedia, listMedia, upload, uploadMedia } from "./media.controller.js";
import { requireCsrf } from "../../middleware/requireCsrf.js";
import { requireAdmin } from "../../middleware/session.js";

export const adminMediaRouter = Router();

adminMediaRouter.get("/", requireAdmin, listMedia);
adminMediaRouter.post("/", requireAdmin, requireCsrf, upload.single("file"), uploadMedia);
adminMediaRouter.delete("/:id", requireAdmin, requireCsrf, deleteMedia);
