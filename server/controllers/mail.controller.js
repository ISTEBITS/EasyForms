import MailTemplate from "../models/MailTemplate.js";
import {
  getMailStatus,
  sendMailWithTemplate,
  renderEmailHtml,
  applyTemplate,
} from "../services/mail.service.js";

/**
 * GET /api/admin/mail/status
 * Get current email transporter configuration status
 */
export async function getMailerStatus(req, res) {
  try {
    const status = getMailStatus();
    const templateCount = await MailTemplate.countDocuments();
    const activeCount = await MailTemplate.countDocuments({ isActive: true });

    return res.status(200).json({
      success: true,
      data: {
        ...status,
        templates: {
          total: templateCount,
          active: activeCount,
        },
      },
    });
  } catch (error) {
    console.error("[MailController] Error getting mailer status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve mailer status",
    });
  }
}

/**
 * GET /api/admin/mail/templates
 * List all email templates
 */
export async function listTemplates(req, res) {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category && category !== "all") {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    const templates = await MailTemplate.find(filter).sort({ isDefault: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error("[MailController] Error listing templates:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to list email templates",
    });
  }
}

/**
 * GET /api/admin/mail/templates/:idOrSlug
 * Get single template by ID or slug
 */
export async function getTemplate(req, res) {
  try {
    const { idOrSlug } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

    const template = isObjectId
      ? await MailTemplate.findById(idOrSlug)
      : await MailTemplate.findOne({ slug: idOrSlug.toLowerCase() });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Email template not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("[MailController] Error getting template:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve email template",
    });
  }
}

/**
 * POST /api/admin/mail/templates
 * Create a new email template
 */
export async function createTemplate(req, res) {
  try {
    const { name, slug, category, subject, body, variables, isActive } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: "Name, subject, and body are required fields",
      });
    }

    // Auto-generate slug if not provided
    const formattedSlug = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const existing = await MailTemplate.findOne({ slug: formattedSlug });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A template with slug "${formattedSlug}" already exists`,
      });
    }

    const template = await MailTemplate.create({
      name: name.trim(),
      slug: formattedSlug,
      category: category || "custom",
      subject: subject.trim(),
      body,
      variables: Array.isArray(variables) ? variables : [],
      isDefault: false,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy: req.user?.sub || "admin",
      updatedBy: req.user?.sub || "admin",
    });

    return res.status(201).json({
      success: true,
      message: "Email template created successfully",
      data: template,
    });
  } catch (error) {
    console.error("[MailController] Error creating template:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create email template",
    });
  }
}

/**
 * PUT /api/admin/mail/templates/:id
 * Update an existing template
 */
export async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    const { name, subject, body, variables, category, isActive } = req.body;

    const template = await MailTemplate.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Email template not found",
      });
    }

    if (name) template.name = name.trim();
    if (subject) template.subject = subject.trim();
    if (body !== undefined) template.body = body;
    if (category) template.category = category;
    if (Array.isArray(variables)) template.variables = variables;
    if (isActive !== undefined) template.isActive = Boolean(isActive);
    template.updatedBy = req.user?.sub || "admin";

    await template.save();

    return res.status(200).json({
      success: true,
      message: "Email template updated successfully",
      data: template,
    });
  } catch (error) {
    console.error("[MailController] Error updating template:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update email template",
    });
  }
}

/**
 * DELETE /api/admin/mail/templates/:id
 * Delete a custom template
 */
export async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;

    const template = await MailTemplate.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Email template not found",
      });
    }

    if (template.isDefault) {
      return res.status(400).json({
        success: false,
        message: "System default templates cannot be deleted (you can edit or deactivate them instead)",
      });
    }

    await MailTemplate.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Email template deleted successfully",
    });
  } catch (error) {
    console.error("[MailController] Error deleting template:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete email template",
    });
  }
}

/**
 * POST /api/admin/mail/preview
 * Preview rendered template HTML given subject, body, and sample variables
 */
export async function previewTemplate(req, res) {
  try {
    const { subject = "", body = "", variables = {} } = req.body;

    const interpolatedSubject = applyTemplate(subject, variables);
    const renderedHtml = renderEmailHtml(body, variables, { title: interpolatedSubject });

    return res.status(200).json({
      success: true,
      data: {
        subject: interpolatedSubject,
        html: renderedHtml,
      },
    });
  } catch (error) {
    console.error("[MailController] Error generating preview:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate template preview",
    });
  }
}

/**
 * POST /api/admin/mail/test
 * Send a test email using an HTML template
 */
export async function sendTestEmail(req, res) {
  try {
    const { to, templateSlug, variables = {}, customSubject, customBody } = req.body;

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return res.status(400).json({
        success: false,
        message: "A valid recipient email address is required",
      });
    }

    const result = await sendMailWithTemplate({
      templateSlug,
      to,
      variables,
      customSubject,
      customBody,
    });

    if (!result.sent) {
      return res.status(400).json({
        success: false,
        message: `Failed to send email: ${result.reason || "Mailer not configured properly"}`,
        details: result,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Test email successfully sent to ${to} via ${result.provider}`,
      data: result,
    });
  } catch (error) {
    console.error("[MailController] Error sending test email:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send test email",
    });
  }
}
