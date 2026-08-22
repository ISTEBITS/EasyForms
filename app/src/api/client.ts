const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ApiError";
  }
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }
  return fallback;
}

function getErrorCode(payload: unknown): string | undefined {
  if (
    payload &&
    typeof payload === "object" &&
    "code" in payload &&
    typeof payload.code === "string"
  ) {
    return payload.code;
  }
  return undefined;
}

function hasSuccessFalse(
  payload: unknown,
): payload is { success: false; message?: string; code?: string } {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "success" in payload &&
      payload.success === false,
  );
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (hasSuccessFalse(data)) {
    throw new ApiError(response.status, data.message || "Action failed", data.code);
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      getErrorMessage(data, "Something went wrong"),
      getErrorCode(data),
    );
  }

  return data as T;
}

export { API_BASE_URL };
