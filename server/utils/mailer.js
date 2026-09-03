/**
 * Mailer utility proxy - delegates to centralized mail service
 */
export {
  sendSubmissionReceipt,
  sendCollaboratorInviteEmail,
  sendEmail,
  sendMailWithTemplate,
  getMailStatus,
  getSenderEmail,
  getAppBaseUrl,
  getSmtpTransporter,
  getMailtrapClient,
  renderEmailHtml,
  applyTemplate,
  escapeHtml,
  seedDefaultTemplates,
} from "../services/mail.service.js";
