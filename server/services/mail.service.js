import nodemailer from "nodemailer";
import { MailtrapClient } from "mailtrap";
import MailTemplate from "../models/MailTemplate.js";

let smtpTransporter = null;
let mailtrapClient = null;

function resolveSecureFlag() {
  if (typeof process.env.SMTP_SECURE === "string") {
    return process.env.SMTP_SECURE.toLowerCase() === "true";
  }
  return Number(process.env.SMTP_PORT || 587) === 465;
}

function parseBoolean(value) {
  return typeof value === "string" && value.toLowerCase() === "true";
}

export function getSenderEmail() {
  return (
    process.env.SMTP_FROM ||
    process.env.MAIL_FROM ||
    process.env.SMTP_USER ||
    process.env.MAILTRAP_FROM ||
    null
  );
}

export function getAppBaseUrl() {
  const envUrl =
    process.env.CLIENT_URL ||
    process.env.APP_URL ||
    process.env.FRONTEND_URL ||
    process.env.ORIGIN;

  if (envUrl) {
    const primary = envUrl.split(",")[0].trim();
    return primary.replace(/\/+$/, "");
  }

  return process.env.NODE_ENV === "production"
    ? "https://easyforms.istebits.com"
    : "http://localhost:5173";
}

export function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  smtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure: resolveSecureFlag(),
    auth: { user, pass },
  });

  return smtpTransporter;
}

export function getMailtrapClient() {
  if (mailtrapClient) return mailtrapClient;
  const token = process.env.MAIL_TOKEN || process.env.MAILTRAP_API_KEY;
  if (!token) return null;

  const useSandbox = parseBoolean(process.env.MAILTRAP_USE_SANDBOX);
  const inboxId = Number(process.env.MAILTRAP_INBOX_ID);

  mailtrapClient = new MailtrapClient({
    token,
    sandbox: useSandbox,
    testInboxId: useSandbox && Number.isFinite(inboxId) ? inboxId : undefined,
  });

  return mailtrapClient;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Replaces {{variableName}} tokens in a template string with provided values
 */
export function applyTemplate(templateString, tokens = {}) {
  let output = String(templateString || "");
  for (const [key, value] of Object.entries(tokens)) {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    output = output.replace(pattern, value !== undefined && value !== null ? String(value) : "");
  }
  return output;
}

/**
 * Wraps an HTML fragment inside a responsive email shell if it is not already a full HTML document
 */
export function renderEmailHtml(htmlContent, tokens = {}, { title = "EasyForms" } = {}) {
  const interpolated = applyTemplate(htmlContent, tokens);

  // If already a full HTML document, return as is
  if (/<html[\s>]/i.test(interpolated) || /<!DOCTYPE\s+html/i.test(interpolated)) {
    return interpolated;
  }

  // Otherwise, wrap in clean email container
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
      ${interpolated}
  </body>
</html>`;
}

export function formatSubmittedAt(value) {
  try {
    return new Date(value).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(value || "");
  }
}

export async function sendEmail({ to, subject, text, html, category = "general" }) {
  const smtpMailer = getSmtpTransporter();
  const tokenMailer = getMailtrapClient();
  const fromEmail = getSenderEmail();

  if (!fromEmail) {
    return { sent: false, reason: "missing_sender_email" };
  }

  if (smtpMailer) {
    await smtpMailer.sendMail({
      from: fromEmail,
      to,
      subject,
      text: text || subject,
      html,
    });
    return { sent: true, provider: "smtp" };
  }

  if (tokenMailer) {
    await tokenMailer.send({
      from: { email: fromEmail, name: process.env.MAIL_FROM_NAME || "EasyForms" },
      to: [{ email: to }],
      subject,
      text: text || subject,
      html,
      category,
    });
    return { sent: true, provider: "mailtrap" };
  }

  return { sent: false, reason: "missing_mailer_config" };
}

export async function sendMailWithTemplate({
  templateSlug,
  to,
  variables = {},
  customSubject,
  customBody,
}) {
  let template = null;
  if (templateSlug) {
    try {
      template = await MailTemplate.findOne({ slug: templateSlug, isActive: true });
    } catch (err) {
      console.error(`[MailService] Failed to query template ${templateSlug}:`, err);
    }
  }

  const rawSubject = customSubject || template?.subject || "EasyForms Notification";
  const rawBody =
    customBody ||
    template?.body ||
    `<div style="font-family: sans-serif; color: #ffffff;">
       <h2 style="margin-top: 0;">EasyForms Notification</h2>
       <p style="color: #a3a3a3;">You have a new update from EasyForms.</p>
     </div>`;

  const subject = applyTemplate(rawSubject, variables).slice(0, 250);
  const html = renderEmailHtml(rawBody, variables, { title: subject });

  return sendEmail({
    to,
    subject,
    text: subject,
    html,
    category: template?.category || "custom",
  });
}

export async function sendSubmissionReceipt({
  to,
  name,
  formTitle,
  submittedAt,
  subjectTemplate,
  messageTemplate,
}) {
  const tokens = {
    name: name || String(to).split("@")[0],
    email: to,
    formTitle: formTitle || "Form",
    submittedAt: formatSubmittedAt(submittedAt || new Date()),
  };

  const dbTemplate = await MailTemplate.findOne({ slug: "submission-receipt", isActive: true }).catch(() => null);

  const rawSubject = subjectTemplate || dbTemplate?.subject || 'Your response to "{{formTitle}}" was received';
  const rawHtml =
    messageTemplate ||
    dbTemplate?.body ||
    `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">Response Received</h2>
      <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
        Hi <strong style="color: #ffffff;">{{name}}</strong>, thank you for completing <strong style="color: #ffffff;">"{{formTitle}}"</strong>.
      </p>
      <div style="background: #171717; border: 1px solid #262626; border-radius: 6px; padding: 14px 18px; margin: 20px 0;">
        <span style="color: #a3a3a3; font-size: 13px;">Submitted On:</span>
        <div style="color: #ffffff; font-size: 14px; font-weight: 600; margin-top: 4px;">{{submittedAt}}</div>
      </div>
      <p style="color: #737373; font-size: 13px; margin: 24px 0 0 0;">
        Best regards,<br><strong style="color: #a3a3a3;">The EasyForms Team</strong>
      </p>
    </div>`;

  const subject = applyTemplate(rawSubject, tokens).slice(0, 200);
  const html = renderEmailHtml(rawHtml, tokens, { title: subject });

  return sendEmail({
    to,
    subject,
    text: subject,
    html,
    category: "submission_receipt",
  });
}

export async function sendCollaboratorInviteEmail({
  to,
  formTitle,
  formId,
  role,
  inviterName,
  inviterEmail,
}) {
  const appBaseUrl = getAppBaseUrl();
  const accessUrl = `${appBaseUrl}/form/${formId}/responses`;
  const safeTitle = formTitle || "Untitled Form";
  const safeInviter = inviterName || inviterEmail || "A team member";

  const tokens = {
    to,
    email: to,
    formTitle: safeTitle,
    formId,
    role,
    inviterName: safeInviter,
    inviterEmail: inviterEmail || "",
    accessUrl,
    appUrl: appBaseUrl,
  };

  const dbTemplate = await MailTemplate.findOne({ slug: "collaborator-invitation", isActive: true }).catch(() => null);

  const rawSubject = dbTemplate?.subject || 'You have been invited to collaborate on "{{formTitle}}"';
  const rawHtml =
    dbTemplate?.body ||
    `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">Collaboration Invitation</h2>
      <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
        <strong style="color: #ffffff;">{{inviterName}}</strong> has invited you to collaborate on the form <strong style="color: #ffffff;">"{{formTitle}}"</strong>.
      </p>
      <div style="background: #171717; border: 1px solid #262626; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
        <span style="color: #a3a3a3; font-size: 13px;">Assigned Role:</span>
        <div style="color: #0070f3; font-size: 15px; font-weight: 700; text-transform: uppercase; margin-top: 4px;">{{role}}</div>
      </div>
      <a href="{{accessUrl}}" style="display: inline-block; background-color: #ffffff; color: #000000; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
        Open Response Sheet &rarr;
      </a>
      <p style="color: #737373; font-size: 12px; margin-top: 32px; border-top: 1px solid #262626; padding-top: 16px;">
        If you were not expecting this invitation, you can safely ignore this email.
      </p>
    </div>`;

  const subject = applyTemplate(rawSubject, tokens);
  const html = renderEmailHtml(rawHtml, tokens, { title: subject });

  return sendEmail({
    to,
    subject,
    text: subject,
    html,
    category: "collaborator_invite",
  });
}

export function getMailStatus() {
  const hasSmtp =
    Boolean(process.env.SMTP_HOST) &&
    Boolean(process.env.SMTP_USER) &&
    Boolean(process.env.SMTP_PASS);
  const hasMailtrapToken = Boolean(process.env.MAIL_TOKEN || process.env.MAILTRAP_API_KEY);
  const senderEmail = getSenderEmail();

  let provider = null;
  if (hasSmtp) provider = "smtp";
  else if (hasMailtrapToken) provider = "mailtrap";

  return {
    configured: Boolean(provider && senderEmail),
    provider,
    senderEmail,
    missing: {
      senderEmail: !senderEmail,
      smtpConfig: !hasSmtp,
      mailtrapToken: !hasMailtrapToken,
    },
  };
}

export async function seedDefaultTemplates() {
  try {
    const baseUrl = getAppBaseUrl();
    const defaultTemplates = [
      {
        name: "Collaborator Invitation",
        slug: "collaborator-invitation",
        category: "invitation",
        subject: 'You have been invited to collaborate on "{{formTitle}}"',
        body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
  <div style="border-bottom: 1px solid #262626; padding-bottom: 16px; margin-bottom: 24px;">
    <span style="font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">EasyForms</span>
  </div>
  <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">Collaboration Invitation</h2>
  <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
    <strong style="color: #ffffff;">{{inviterName}}</strong> has invited you to collaborate on <strong style="color: #ffffff;">"{{formTitle}}"</strong>.
  </p>
  <div style="background: #171717; border: 1px solid #262626; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
    <span style="color: #a3a3a3; font-size: 13px;">Assigned Role:</span>
    <div style="color: #0070f3; font-size: 15px; font-weight: 700; text-transform: uppercase; margin-top: 4px;">{{role}}</div>
  </div>
  <a href="{{accessUrl}}" style="display: inline-block; background-color: #ffffff; color: #000000; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
    Open Response Sheet &rarr;
  </a>
  <p style="color: #737373; font-size: 12px; margin-top: 32px; border-top: 1px solid #262626; padding-top: 16px;">
    If you were not expecting this invitation, you can safely ignore this email.
  </p>
</div>`,
        variables: [
          { key: "formTitle", description: "Title of the form", sample: "Product Feedback Survey" },
          { key: "role", description: "Collaborator role (viewer, editor, admin)", sample: "editor" },
          { key: "inviterName", description: "Name of the inviter", sample: "Alex Doe" },
          { key: "inviterEmail", description: "Email of the inviter", sample: "alex@example.com" },
          { key: "accessUrl", description: "Link directly to response sheet", sample: `${baseUrl}/form/123/responses` },
        ],
        isDefault: true,
        isActive: true,
      },
      {
        name: "Submission Receipt",
        slug: "submission-receipt",
        category: "submission_receipt",
        subject: 'Your response to "{{formTitle}}" was received',
        body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
  <div style="border-bottom: 1px solid #262626; padding-bottom: 16px; margin-bottom: 24px;">
    <span style="font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">EasyForms</span>
  </div>
  <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">Response Received</h2>
  <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
    Hi <strong style="color: #ffffff;">{{name}}</strong>, thank you for completing <strong style="color: #ffffff;">"{{formTitle}}"</strong>.
  </p>
  <div style="background: #171717; border: 1px solid #262626; border-radius: 6px; padding: 14px 18px; margin: 20px 0;">
    <span style="color: #a3a3a3; font-size: 13px;">Submitted On:</span>
    <div style="color: #ffffff; font-size: 14px; font-weight: 600; margin-top: 4px;">{{submittedAt}}</div>
  </div>
  <p style="color: #737373; font-size: 13px; margin: 24px 0 0 0;">
    Best regards,<br><strong style="color: #a3a3a3;">The EasyForms Team</strong>
  </p>
</div>`,
        variables: [
          { key: "name", description: "Name of the respondent", sample: "Jane Smith" },
          { key: "email", description: "Email of the respondent", sample: "jane@example.com" },
          { key: "formTitle", description: "Title of the form submitted", sample: "Customer Satisfaction Survey" },
          { key: "submittedAt", description: "Formatted timestamp of submission", sample: "Sep 3, 2026, 3:00 PM" },
        ],
        isDefault: true,
        isActive: true,
      },
      {
        name: "Responder Follow-up",
        slug: "responder-followup",
        category: "notification",
        subject: 'Update regarding your submission to "{{formTitle}}"',
        body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
  <div style="border-bottom: 1px solid #262626; padding-bottom: 16px; margin-bottom: 24px;">
    <span style="font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">EasyForms</span>
  </div>
  <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">Submission Update</h2>
  <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
    Hi <strong style="color: #ffffff;">{{name}}</strong>, thank you again for completing <strong style="color: #ffffff;">"{{formTitle}}"</strong>.
  </p>
  <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
    We are reviewing all feedback and will get back to you shortly with next steps.
  </p>
  <p style="color: #737373; font-size: 13px; margin: 24px 0 0 0;">
    Best regards,<br><strong style="color: #a3a3a3;">The EasyForms Team</strong>
  </p>
</div>`,
        variables: [
          { key: "name", description: "Name of the respondent", sample: "Jane Smith" },
          { key: "formTitle", description: "Title of the form", sample: "Customer Satisfaction Survey" },
        ],
        isDefault: false,
        isActive: true,
      },
    ];

    for (const tpl of defaultTemplates) {
      const existing = await MailTemplate.findOne({ slug: tpl.slug });
      if (!existing) {
        await MailTemplate.create(tpl);
        console.log(`[MailService] Seeded default HTML template: ${tpl.slug}`);
      }
    }
  } catch (err) {
    console.error("[MailService] Failed to seed default templates:", err);
  }
}
