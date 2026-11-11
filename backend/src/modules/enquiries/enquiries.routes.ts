import { Router } from "express";
import {
  adminCreateEnquiryNote,
  adminGetEnquiry,
  adminListEnquiries,
  adminListEnquiryNotes,
  adminUpdateEnquiryStatus,
  publicCreateEnquiry,
} from "./enquiries.controller.js";
import { requireCsrf } from "../../middleware/requireCsrf.js";
import { enquiryLimiter } from "../../middleware/rateLimiters.js";
import { requireAdmin } from "../../middleware/session.js";

export const publicEnquiriesRouter = Router();

// Public contact form — rate limited, unauthenticated by design.
publicEnquiriesRouter.post("/", enquiryLimiter, publicCreateEnquiry);

export const adminEnquiriesRouter = Router();

adminEnquiriesRouter.get("/", requireAdmin, adminListEnquiries);
adminEnquiriesRouter.get("/:id/notes", requireAdmin, adminListEnquiryNotes);
adminEnquiriesRouter.get("/:id", requireAdmin, adminGetEnquiry);
adminEnquiriesRouter.patch("/:id", requireAdmin, requireCsrf, adminUpdateEnquiryStatus);
adminEnquiriesRouter.post("/:id/notes", requireAdmin, requireCsrf, adminCreateEnquiryNote);
