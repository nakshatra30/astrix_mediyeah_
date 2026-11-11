import { Router } from "express";
import { adminAuthRouter } from "../modules/auth/auth.routes.js";
import { adminCategoriesRouter, publicCategoriesRouter } from "../modules/categories/categories.routes.js";
import { adminEnquiriesRouter, publicEnquiriesRouter } from "../modules/enquiries/enquiries.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
import { adminMediaRouter } from "../modules/media/media.routes.js";
import { adminProjectsRouter, publicProjectsRouter } from "../modules/projects/projects.routes.js";
import { adminServicesRouter, publicServicesRouter } from "../modules/services/services.routes.js";
import { adminSettingsRouter, publicSettingsRouter } from "../modules/settings/settings.routes.js";
import { adminTestimonialsRouter, publicTestimonialsRouter } from "../modules/testimonials/testimonials.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);

apiRouter.use("/projects", publicProjectsRouter);
apiRouter.use("/admin/projects", adminProjectsRouter);

apiRouter.use("/categories", publicCategoriesRouter);
apiRouter.use("/admin/categories", adminCategoriesRouter);

apiRouter.use("/services", publicServicesRouter);
apiRouter.use("/admin/services", adminServicesRouter);

apiRouter.use("/testimonials", publicTestimonialsRouter);
apiRouter.use("/admin/testimonials", adminTestimonialsRouter);

apiRouter.use("/enquiries", publicEnquiriesRouter);
apiRouter.use("/admin/enquiries", adminEnquiriesRouter);

apiRouter.use("/site-settings", publicSettingsRouter);
apiRouter.use("/admin/site-settings", adminSettingsRouter);

apiRouter.use("/auth", adminAuthRouter);
apiRouter.use("/admin/media", adminMediaRouter);
