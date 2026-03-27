export type CreateBrokerConnectSessionResult = {
  provider: string;
  providerConnectionId: string;
  externalUserId?: string;
  redirectUrl: string;
  providerToken: string;
};

export type FinalizeBrokerConnectResult = {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
  providerMetadata?: Record<string, unknown>;
  providerAccounts: Array<{
    providerAccountId: string;
    name: string;
    accountType?: string;
  }>;
};

export type BrokerProviderErrorCode =
  | "INVALID_TOKEN"
  | "MFA_REQUIRED"
  | "RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE"
  | "UNKNOWN";

export class BrokerProviderError extends Error {
  constructor(
    public readonly code: BrokerProviderErrorCode,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export interface BrokerProvider {
  createConnectSession(userId: string): Promise<CreateBrokerConnectSessionResult>;
  finalizeConnect(
    userId: string,
    providerConnectionId: string,
    providerToken: string
  ): Promise<FinalizeBrokerConnectResult>;
  revokeConnection(
    userId: string,
    providerConnectionId: string,
    accessToken?: string | null
  ): Promise<void>;
}

