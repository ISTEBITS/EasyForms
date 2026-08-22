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
