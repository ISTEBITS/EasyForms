export interface AuthUser {
  sub: string;
  role: "admin" | "test_user" | string;
  testUserId?: string;
  email?: string;
  name?: string;
  picture?: string;
  iat: number;
  exp: number;
}

export interface AuthLoginResponse {
  success: boolean;
  message?: string;
}

export interface AuthVerifyResponse {
  success: boolean;
  user?: AuthUser;
  message?: string;
}

export interface MailStatusResponse {
  configured: boolean;
  provider: "smtp" | "mailtrap" | null;
  senderEmail: string | null;
  missing: {
    senderEmail: boolean;
    smtpConfig: boolean;
    mailtrapToken: boolean;
  };
}

export interface TestUserActivity {
  _id?: string;
  testUserId: string;
  email: string;
  action: string;
  formId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  isExpired?: boolean;
  createdAt: string;
}

export interface ApiKeyStats {
  keyId: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  isExpired?: boolean;
  createdAt: string;
  totalRequests: number;
  failedAttempts: number;
  requestsByEndpoint: Record<string, number>;
  requestsByDay: Record<string, number>;
}
