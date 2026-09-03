import { apiRequest } from "./client";

export interface MailVariable {
  key: string;
  description: string;
  sample?: string;
}

export interface MailTemplate {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  category: "invitation" | "submission_receipt" | "notification" | "custom";
  subject: string;
  body: string;
  variables: MailVariable[];
  isDefault: boolean;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MailerStatus {
  configured: boolean;
  provider: "smtp" | "mailtrap" | null;
  senderEmail: string | null;
  missing: {
    senderEmail: boolean;
    smtpConfig: boolean;
    mailtrapToken: boolean;
  };
  templates: {
    total: number;
    active: number;
  };
}

export interface CreateMailTemplatePayload {
  name: string;
  slug?: string;
  category?: "invitation" | "submission_receipt" | "notification" | "custom";
  subject: string;
  body: string;
  variables?: MailVariable[];
  isActive?: boolean;
}

export interface UpdateMailTemplatePayload {
  name?: string;
  category?: "invitation" | "submission_receipt" | "notification" | "custom";
  subject?: string;
  body?: string;
  variables?: MailVariable[];
  isActive?: boolean;
}

export interface SendTestEmailPayload {
  to: string;
  templateSlug?: string;
  variables?: Record<string, string>;
  customSubject?: string;
  customBody?: string;
}

export interface PreviewTemplatePayload {
  subject: string;
  body: string;
  variables?: Record<string, string>;
}

export interface PreviewResponse {
  subject: string;
  html: string;
}

export const mailApi = {
  getStatus: () =>
    apiRequest<{ success: boolean; data: MailerStatus }>("/admin/mail/status").then(
      (res) => res.data,
    ),

  listTemplates: (params?: { category?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append("category", params.category);
    if (params?.search) searchParams.append("search", params.search);
    const query = searchParams.toString();

    return apiRequest<{ success: boolean; data: MailTemplate[] }>(
      `/admin/mail/templates${query ? `?${query}` : ""}`,
    ).then((res) => res.data);
  },

  getTemplate: (idOrSlug: string) =>
    apiRequest<{ success: boolean; data: MailTemplate }>(
      `/admin/mail/templates/${idOrSlug}`,
    ).then((res) => res.data),

  createTemplate: (payload: CreateMailTemplatePayload) =>
    apiRequest<{ success: boolean; data: MailTemplate }>("/admin/mail/templates", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((res) => res.data),

  updateTemplate: (id: string, payload: UpdateMailTemplatePayload) =>
    apiRequest<{ success: boolean; data: MailTemplate }>(
      `/admin/mail/templates/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    ).then((res) => res.data),

  deleteTemplate: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(
      `/admin/mail/templates/${id}`,
    ).then((res) => res),

  previewTemplate: (payload: PreviewTemplatePayload) =>
    apiRequest<{ success: boolean; data: PreviewResponse }>(
      "/admin/mail/preview",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ).then((res) => res.data),

  sendTestEmail: (payload: SendTestEmailPayload) =>
    apiRequest<{ success: boolean; message: string; data: unknown }>(
      "/admin/mail/test",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ).then((res) => res.data),
};
