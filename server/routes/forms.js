import express from "express";
import { validate } from '../middlewares/validate.js';
import { createFormSchema, updateFormSchema } from '../validators/form.validator.js';
import rateLimit from 'express-rate-limit';

import { checkCookies } from "../middlewares/auth.middleware.js";
import { checkApiKeyOptional } from "../middlewares/api-key.middleware.js";
import {
  handleGetAllForms,
  handleGetSingleForm,
  handleCreateNewForm,
  handleUpdateForm,
  handleDeleteForm,
  handleGetResponseForAForm,
  handleSubmitAResponse,
  handleCheckStatus,
  handleGetPublicForm,
  handleGetPublicFormBySlug,
  handleGetMailStatus,
  handleGetTestUserActivities,
} from "../controllers/form.controllers.js";

const router = express.Router();

// Rate limiter for response submissions (spam prevention)
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many submissions. Please try again later.' },
});

// Get all forms
router.get("/", checkCookies, handleGetAllForms);
router.get("/mail/status", checkCookies, handleGetMailStatus);
router.get("/test-users/activities", checkCookies, handleGetTestUserActivities);

// Get a public form published (supports optional API key auth via query param)
router.get("/public/slug/:slug", checkApiKeyOptional, handleGetPublicFormBySlug);
router.get("/public/:id", checkApiKeyOptional, handleGetPublicForm);

//Get a single form (protected)
router.get('/:id', checkCookies, handleGetSingleForm);

// Create a new form
router.post("/", checkCookies, validate(createFormSchema), handleCreateNewForm);

// Update a form
router.put("/:id", checkCookies, validate(updateFormSchema), handleUpdateForm);

// Delete a form
router.delete("/:id", checkCookies, handleDeleteForm);

// Get responses for a form
router.get("/:id/responses", checkCookies, handleGetResponseForAForm);

//Submit a response (public, rate-limited, optional API key auth)
router.post("/:id/responses", submitLimiter, checkApiKeyOptional, handleSubmitAResponse);

//Check Status of a form submit
router.get("/:id/check-status", handleCheckStatus);

export default router;



