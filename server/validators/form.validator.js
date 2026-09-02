import { z } from 'zod';

const questionSchema = z.object({
  id: z.string(),
  type: z.enum([
    "short_text",
    "long_text",
    "multiple_choice",
    "checkbox",
    "dropdown",
    "rating",
    "date",
    "email",
    "number",
    "file_upload",
    "section_break",
  ]),
  title: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(z.any()).optional(),
  placeholder: z.string().optional(),
  maxLength: z.number().optional(),
  minRating: z.number().optional(),
  maxRating: z.number().optional(),
  allowMultiple: z.boolean().optional(),
  acceptFileTypes: z.string().optional(),
  maxFileSize: z.number().optional(),
});

const settingsSchema = z.object({
  allowMultipleResponses: z.boolean().optional(),
  requireLogin: z.boolean().optional(),
  showProgressBar: z.boolean().optional(),
  confirmationMessage: z.string().optional(),
  responseDeadlineAt: z.string().datetime().nullable().optional(),
  maxResponses: z.number().int().min(1).nullable().optional(),
  closedMessage: z.string().max(500).optional(),
  emailNotification: z.object({
    enabled: z.boolean().optional(),
    subject: z.string().max(200).optional(),
    message: z.string().max(5000).optional(),
  }).optional(),
  limitOneResponse: z.boolean().optional(),
  redirectUrl: z.string().optional(),
  theme: z.object({
    primaryColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    fontFamily: z.string().optional(),
    logoUrl: z.string().optional(),
    bannerUrl: z.string().optional(),
    bannerPositionX: z.number().min(0).max(100).optional(),
    bannerPositionY: z.number().min(0).max(100).optional(),
    brandName: z.string().optional(),
    brandTagline: z.string().optional(),
  }).optional(),
});

const formBodySchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional(),
  questions: z.array(questionSchema),
  settings: settingsSchema.optional(),
  isPublished: z.boolean().optional(),
});

export const createFormSchema = z.object({
  body: z.object({
    ...formBodySchema.shape,
  }),
});

export const updateFormSchema = z.object({
  body: formBodySchema.partial(),
});
