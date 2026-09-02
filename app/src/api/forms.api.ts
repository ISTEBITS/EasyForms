import type { Form, FormResponse } from "@/types/form";
import { apiRequest } from "./client";
import type { ApiKey, ApiKeyStats, MailStatusResponse, TestUserActivity } from "./types";

type ApiPayload = Record<string, unknown>;

function transformForm(data: ApiPayload): Form {
  return {
    ...data,
    id: String(data._id || data.id || ""),
  } as Form;
}

function transformResponse(data: ApiPayload): FormResponse {
  return {
    ...data,
    id: String(data._id || data.id || ""),
  } as FormResponse;
}

export const formsApi = {
  getAll: async (): Promise<Form[]> => {
    const data = await apiRequest<ApiPayload[]>("/forms");
    return data.map(transformForm);
  },

  getById: async (id: string): Promise<Form> => {
    const data = await apiRequest<ApiPayload>(`/forms/public/${id}`);
    return transformForm(data);
  },

  getBySlug: async (slug: string): Promise<Form> => {
    const data = await apiRequest<ApiPayload>(`/forms/public/slug/${encodeURIComponent(slug)}`);
    return transformForm(data);
  },

  getPublic: async (idOrSlug: string): Promise<Form> => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug.trim());
    if (isObjectId) {
      try {
        const data = await apiRequest<ApiPayload>(`/forms/public/${idOrSlug}`);
        return transformForm(data);
      } catch {
        const data = await apiRequest<ApiPayload>(`/forms/public/slug/${encodeURIComponent(idOrSlug)}`);
        return transformForm(data);
      }
    } else {
      try {
        const data = await apiRequest<ApiPayload>(`/forms/public/slug/${encodeURIComponent(idOrSlug)}`);
        return transformForm(data);
      } catch {
        const data = await apiRequest<ApiPayload>(`/forms/public/${idOrSlug}`);
        return transformForm(data);
      }
    }
  },

  getByIdAdmin: async (id: string): Promise<Form> => {
    const data = await apiRequest<ApiPayload>(`/forms/${id}`);
    return transformForm(data);
  },

  create: async (form: Omit<Form, "_id">): Promise<Form> => {
    const data = await apiRequest<ApiPayload>("/forms", {
      method: "POST",
      body: JSON.stringify(form),
    });
    return transformForm(data);
  },

  update: async (id: string, form: Partial<Form>): Promise<Form> => {
    const data = await apiRequest<ApiPayload>(`/forms/${id}`, {
      method: "PUT",
      body: JSON.stringify(form),
    });
    return transformForm(data);
  },

  delete: async (id: string): Promise<void> => {
    await apiRequest(`/forms/${id}`, {
      method: "DELETE",
    });
  },

  getResponses: async (id: string): Promise<FormResponse[]> => {
    const data = await apiRequest<ApiPayload[]>(`/forms/${id}/responses`);
    return data.map(transformResponse);
  },

  updateResponse: async (
    formId: string,
    responseId: string,
    data: Partial<FormResponse> & { newNote?: string; clientId?: string }
  ): Promise<FormResponse> => {
    const res = await apiRequest<ApiPayload>(`/forms/${formId}/responses/${responseId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return transformResponse(res);
  },

  deleteResponse: async (formId: string, responseId: string): Promise<void> => {
    await apiRequest(`/forms/${formId}/responses/${responseId}`, {
      method: "DELETE",
    });
  },

  bulkDeleteResponses: async (formId: string, responseIds: string[]): Promise<void> => {
    await apiRequest(`/forms/${formId}/responses/bulk-delete`, {
      method: "POST",
      body: JSON.stringify({ responseIds }),
    });
  },

  bulkUpdateResponseStatus: async (formId: string, responseIds: string[], status: string): Promise<void> => {
    await apiRequest(`/forms/${formId}/responses/bulk-update-status`, {
      method: "POST",
      body: JSON.stringify({ responseIds, status }),
    });
  },

  manualCreateResponse: async (
    formId: string,
    data: {
      answers: FormResponse["answers"];
      respondentEmail?: string;
      respondentName?: string;
      status?: string;
      tags?: string[];
      clientId?: string;
    }
  ): Promise<FormResponse> => {
    const res = await apiRequest<ApiPayload>(`/forms/${formId}/responses/manual`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return transformResponse(res);
  },

  addCollaborator: async (
    formId: string,
    email: string,
    role: "viewer" | "editor" | "admin",
    sendEmail: boolean = true
  ): Promise<Form["collaborators"]> => {
    return apiRequest<Form["collaborators"]>(`/forms/${formId}/collaborators`, {
      method: "POST",
      body: JSON.stringify({ email, role, sendEmail }),
    });
  },

  removeCollaborator: async (
    formId: string,
    collaboratorId: string
  ): Promise<Form["collaborators"]> => {
    return apiRequest<Form["collaborators"]>(`/forms/${formId}/collaborators/${collaboratorId}`, {
      method: "DELETE",
    });
  },

  updateShareSettings: async (
    formId: string,
    shareSettings: { isPublicShareEnabled: boolean; publicPermission?: "viewer" | "editor" }
  ): Promise<Form["shareSettings"]> => {
    return apiRequest<Form["shareSettings"]>(`/forms/${formId}/share-settings`, {
      method: "PATCH",
      body: JSON.stringify(shareSettings),
    });
  },

  getSharedResponses: async (
    shareToken: string
  ): Promise<{ form: Form; responses: FormResponse[] }> => {
    const data = await apiRequest<{ form: ApiPayload; responses: ApiPayload[] }>(
      `/forms/public/shared-responses/${shareToken}`
    );
    return {
      form: transformForm(data.form),
      responses: data.responses.map(transformResponse),
    };
  },

  getMailStatus: async (): Promise<MailStatusResponse> => {
    return apiRequest<MailStatusResponse>("/forms/mail/status");
  },

  getTestUserActivities: async (): Promise<TestUserActivity[]> => {
    return apiRequest<TestUserActivity[]>("/forms/test-users/activities");
  },

  submitResponse: async (
    id: string,
    data: { answers: FormResponse["answers"]; googleToken?: string },
  ): Promise<FormResponse> => {
    const response = await apiRequest<ApiPayload>(`/forms/${id}/responses`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return transformResponse(response);
  },
};

export const getFormResponses = async (formId: string) => {
  return apiRequest<FormResponse[]>(`/forms/${formId}/responses`);
};

export const getFormById = async (formId: string) => {
  return formsApi.getById(formId);
};

export const apiKeysApi = {
  list: async (): Promise<ApiKey[]> => {
    return apiRequest<ApiKey[]>('/api-keys');
  },

  create: async (name: string, scopes?: string[], expiresInDays?: number | null): Promise<{ apiKey: string; id: string; name: string; expiresAt: string | null }> => {
    return apiRequest<{ apiKey: string; id: string; name: string; expiresAt: string | null }>('/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, scopes, expiresInDays }),
    });
  },

  revoke: async (keyId: string): Promise<void> => {
    await apiRequest(`/api-keys/${keyId}`, { method: 'DELETE' });
  },

  stats: async (): Promise<ApiKeyStats[]> => {
    return apiRequest<ApiKeyStats[]>('/api-keys/stats');
  },
};
