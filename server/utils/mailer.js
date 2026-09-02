import nodemailer from "nodemailer";
import { MailtrapClient } from "mailtrap";

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

function getSenderEmail() {
  return (
    process.env.SMTP_FROM ||
    process.env.MAIL_FROM ||
    process.env.SMTP_USER ||
    process.env.MAILTRAP_FROM ||
    null
  );
}

function getSmtpTransporter() {
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

function getMailtrapClient() {
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

function formatSubmittedAt(value) {
  try {
    return new Date(value).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(value);
  }
}

function applyTemplate(template, tokens) {
  let output = template;
  for (const [key, value] of Object.entries(tokens)) {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    output = output.replace(pattern, value);
  }
  return output;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeUrl(value) {
  if (/^(https?:\/\/|mailto:)/i.test(value)) return value;
  return "#";
}

function renderInlineMarkdown(value) {
  return value
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_, text, href) =>
        `<a href="${sanitizeUrl(href)}" target="_blank" rel="noopener noreferrer" style="color:#0891b2;text-decoration:underline;">${text}</a>`,
    )
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>");
}

function renderMarkdownToEmailHtml(value) {
  const lines = escapeHtml(value || "").split(/\r?\n/);
  const output = [];
  let inUl = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (inUl) {
        output.push("</ul>");
        inUl = false;
      }
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      if (inUl) {
        output.push("</ul>");
        inUl = false;
      }
      const level = heading[1].length;
      output.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const listItem = line.match(/^[-*]\s+(.+)$/);
    if (listItem) {
      if (!inUl) {
        output.push("<ul>");
        inUl = true;
      }
      output.push(`<li>${renderInlineMarkdown(listItem[1])}</li>`);
      continue;
    }

    if (inUl) {
      output.push("</ul>");
      inUl = false;
    }

    output.push(`<p>${renderInlineMarkdown(line)}</p>`);
  }

  if (inUl) output.push("</ul>");
  return output.join("");
}

export async function sendSubmissionReceipt({
  to,
  name,
  formTitle,
  submittedAt,
  subjectTemplate,
  messageTemplate,
}) {
  const smtpMailer = getSmtpTransporter();
  const tokenMailer = getMailtrapClient();
  const fromEmail = getSenderEmail();
  if (!fromEmail) return { sent: false, reason: "missing_sender_email" };

  const tokens = {
    name: name || String(to).split("@")[0],
    email: to,
    formTitle: formTitle || "Form",
    submittedAt: formatSubmittedAt(submittedAt),
  };

  const subject = applyTemplate(
    subjectTemplate || "Your response to {{formTitle}} was received",
    tokens,
  ).slice(0, 200);

  const text = applyTemplate(
    messageTemplate ||
      'Hi {{name}},\n\nThank you for completing "{{formTitle}}". We have recorded your submission on {{submittedAt}}.',
    tokens,
  );

  const html = `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">${renderMarkdownToEmailHtml(text)}</div>`;

  if (smtpMailer) {
    await smtpMailer.sendMail({
      from: fromEmail,
      to,
      subject,
      text,
      html,
    });
    return { sent: true, provider: "smtp" };
  }

  if (tokenMailer) {
    await tokenMailer.send({
      from: { email: fromEmail, name: process.env.MAIL_FROM_NAME || "Easy Forms" },
      to: [{ email: to }],
      subject,
      text,
      html,
      category: "submission_receipt",
    });
    return { sent: true, provider: "mailtrap" };
  }
  return { sent: false, reason: "missing_mailer_config" };
}

export async function sendCollaboratorInviteEmail({
  to,
  formTitle,
  formId,
  role,
  inviterName,
  inviterEmail,
}) {
  const smtpMailer = getSmtpTransporter();
  const tokenMailer = getMailtrapClient();
  const fromEmail = getSenderEmail();
  if (!fromEmail) return { sent: false, reason: "missing_sender_email" };

  const appBaseUrl = process.env.CLIENT_URL || process.env.APP_URL || "http://localhost:5173";
  const accessUrl = `${appBaseUrl}/forms/${formId}/responses`;
  const subject = `You've been invited to collaborate on "${formTitle || "a form"}"`;

  const roleDescription =
    role === "admin"
      ? "Manage form settings, responses, and team collaborators"
      : role === "editor"
      ? "View responses, edit submission data, and add internal notes"
      : "View form responses and summary analytics";

  const safeTitle = escapeHtml(formTitle || "Untitled Form");
  const safeInviter = escapeHtml(inviterName || inviterEmail || "A team member");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #000000; margin: 0; padding: 32px 16px; color: #ffffff;">
        <div style="max-width: 520px; margin: 0 auto; background: #0a0a0a; border: 1px solid #262626; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
          <div style="display: inline-block; background-color: #171717; color: #a3a3a3; font-size: 11px; font-family: monospace; font-weight: 600; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #262626;">
            Collaboration Invite
          </div>
          <h1 style="font-size: 20px; font-weight: 600; margin: 16px 0 8px; color: #ffffff; letter-spacing: -0.02em;">
            Join &ldquo;${safeTitle}&rdquo;
          </h1>
          <p style="font-size: 14px; line-height: 1.6; color: #a3a3a3; margin: 12px 0;">
            <strong style="color: #ffffff;">${safeInviter}</strong> has invited you to collaborate on the form <strong style="color: #ffffff;">&ldquo;${safeTitle}&rdquo;</strong> on EasyForms.
          </p>
          
          <div style="background: #171717; border: 1px solid #262626; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; font-weight: 600; color: #ffffff;">
              Assigned Role: <span style="text-transform: capitalize; color: #60a5fa;">${role}</span>
            </p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #737373;">
              ${roleDescription}
            </p>
          </div>

          <p style="font-size: 14px; color: #a3a3a3; margin: 16px 0;">
            Click below to open the responses spreadsheet and start collaborating:
          </p>
          
          <div style="margin: 24px 0;">
            <a href="${accessUrl}" style="display: inline-block; background: #ffffff; color: #000000 !important; text-decoration: none; padding: 10px 20px; font-size: 13px; font-weight: 600; border-radius: 6px; text-align: center;">
              Open Responses Sheet &rarr;
            </a>
          </div>

          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #262626; font-size: 11px; font-family: monospace; color: #525252;">
            <p style="margin: 0;">If you were not expecting this invitation, you can ignore this email.</p>
            <p style="margin: 4px 0 0;">EasyForms &bull; Response Collaboration Suite</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `You've been invited by ${inviterName || inviterEmail || "a team member"} to collaborate on "${formTitle}" as a ${role}.\n\nAccess the responses here: ${accessUrl}`;

  if (smtpMailer) {
    await smtpMailer.sendMail({
      from: fromEmail,
      to,
      subject,
      text,
      html,
    });
    return { sent: true, provider: "smtp" };
  }

  if (tokenMailer) {
    await tokenMailer.send({
      from: { email: fromEmail, name: process.env.MAIL_FROM_NAME || "Easy Forms" },
      to: [{ email: to }],
      subject,
      text,
      html,
      category: "collaborator_invite",
    });
    return { sent: true, provider: "mailtrap" };
  }

  return { sent: false, reason: "missing_mailer_config" };
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
