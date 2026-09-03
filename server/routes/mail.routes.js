import express from "express";
import { checkCookies, requireAdmin } from "../middlewares/auth.middleware.js";
import {
  getMailerStatus,
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
  sendTestEmail,
} from "../controllers/mail.controller.js";

const router = express.Router();

// Enforce authentication & admin permissions across all mail routes
router.use(checkCookies, requireAdmin);

// Diagnostics & status
router.get("/status", getMailerStatus);

// Template preview
router.post("/preview", previewTemplate);

// Test email dispatch
router.post("/test", sendTestEmail);

// Template CRUD
router.get("/templates", listTemplates);
router.get("/templates/:idOrSlug", getTemplate);
router.post("/templates", createTemplate);
router.put("/templates/:id", updateTemplate);
router.delete("/templates/:id", deleteTemplate);

export default router;
