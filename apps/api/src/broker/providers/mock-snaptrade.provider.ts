import crypto from "crypto";
import type {
  BrokerProvider,
  CreateBrokerConnectSessionResult,
  FinalizeBrokerConnectResult
} from "./broker-provider";
import { BrokerProviderError } from "./broker-provider";

export class MockSnaptradeProvider implements BrokerProvider {
  constructor(private readonly providerName: string = "snaptrade") {}

  async createConnectSession(userId: string): Promise<CreateBrokerConnectSessionResult> {
    const now = Date.now();
    const seed = `${userId}:${now}`;
    const providerConnectionId = `${this.providerName}_session_${sha256Hex(seed).slice(0, 16)}`;
    const providerToken = `${this.providerName}_token_${sha256Hex(providerConnectionId).slice(0, 16)}`;

    const webBaseUrl = process.env.WEB_PUBLIC_URL ?? "http://localhost:3000";
    // For MVP, we return the callback URL so the frontend can directly invoke it.
    const redirectUrl = `${webBaseUrl}/broker/connect/callback?sessionId=${encodeURIComponent(
      providerConnectionId
    )}&providerToken=${encodeURIComponent(providerToken)}`;

    return {
      provider: this.providerName,
      providerConnectionId,
      redirectUrl,
      providerToken
    };
  }

  async finalizeConnect(
    userId: string,
    providerConnectionId: string,
    providerToken: string
  ): Promise<FinalizeBrokerConnectResult> {
    // MVP: minimal verification for development/testing.
    const expectedToken = `${this.providerName}_token_${sha256Hex(providerConnectionId).slice(0, 16)}`;
    if (providerToken !== expectedToken) {
      throw new BrokerProviderError("INVALID_TOKEN", "Invalid provider token");
    }

    const suffix = sha256Hex(`${userId}:${providerConnectionId}`).slice(0, 6).toUpperCase();
    return {
      accessToken: `access_${this.providerName}_${suffix}`,
      refreshToken: `refresh_${this.providerName}_${suffix}`,
      accessTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      providerMetadata: { mock: true, provider: this.providerName },
      providerAccounts: [
        {
          providerAccountId: `${this.providerName}_acc_${suffix}`,
          name: `${this.providerName.toUpperCase()} Account ${suffix}`,
          accountType: "investment"
        }
      ]
    };
  }

  async revokeConnection(
    userId: string,
    providerConnectionId: string
  ): Promise<void> {
    // Mock provider has no remote state; method exists for contract parity.
    void userId;
    void providerConnectionId;
  }
}

const sha256Hex = (value: string): string => {
  return crypto.createHash("sha256").update(value).digest("hex");
};

