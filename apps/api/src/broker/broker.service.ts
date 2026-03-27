import {
  BadRequestException,
  Logger,
  ServiceUnavailableException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from "@prisma/client";
import { PrismaService } from '../prisma/prisma.service';
import { MockSnaptradeProvider } from './providers/mock-snaptrade.provider';
import {
  BrokerProviderError,
  type BrokerProvider,
} from './providers/broker-provider';
import { syncBrokerOnce } from '../workers/sync-broker.worker';
import { decryptToken, encryptToken } from '../common/security/token-crypto';
import { env } from '../config/env';

@Injectable()
export class BrokerService {
  private readonly logger = new Logger(BrokerService.name);
  private readonly providers: Record<string, BrokerProvider>;

  constructor(private readonly prisma: PrismaService) {
    // MVP: mock provider implementations for multiple brokerage brands.
    this.providers = {
      snaptrade: new MockSnaptradeProvider("snaptrade"),
      fidelity: new MockSnaptradeProvider("fidelity"),
      schwab: new MockSnaptradeProvider("schwab"),
      robinhood: new MockSnaptradeProvider("robinhood"),
      trading212: new MockSnaptradeProvider("trading212")
    };
  }

  async createConnectSession(userId: string, providerName?: string) {
    const providerKey = (providerName ?? "snaptrade").toLowerCase();
    const provider = this.resolveProvider(providerKey);
    const providerConnection = await this.withProviderErrorHandling(() =>
      provider.createConnectSession(userId),
      providerKey
    );
    const session = await this.prisma.brokerConnection.create({
      data: {
        userId,
        provider: providerConnection.provider,
        providerConnectionId: providerConnection.providerConnectionId,
        externalUserId: providerConnection.externalUserId ?? null,
        status: 'pending',
        encryptedAccessToken: providerConnection.providerToken
          ? encryptToken(providerConnection.providerToken, env.brokerTokenEncryptionKey)
          : null,
        lastSyncStatus: "pending",
        lastSyncAttemptAt: new Date()
      },
    });

    return {
      redirectUrl: providerConnection.redirectUrl,
      providerToken: providerConnection.providerToken,
      id: session.id,
    };
  }

  async finalizeConnect(
    userId: string,
    sessionId: string,
    providerToken?: string,
  ) {
    const existing = await this.prisma.brokerConnection.findFirst({
      where: {
        id: sessionId,
        userId,
        status: 'pending',
      },
    });
    if (!existing)
      throw new NotFoundException('Broker connect session not found');

    const provider = this.resolveProvider(existing.provider);
    const tokenToUse =
      providerToken ||
      decryptToken(existing.encryptedAccessToken, env.brokerTokenEncryptionKey);
    if (!tokenToUse) {
      throw new BadRequestException(
        "Missing provider token to finalize connection."
      );
    }
    const finalized = await this.withProviderErrorHandling(
      () =>
        provider.finalizeConnect(
          userId,
          existing.providerConnectionId,
          tokenToUse,
        ),
      existing.provider
    );

    const updated = await this.prisma.brokerConnection.update({
      where: { id: existing.id },
      data: {
        status: 'connected',
        authExpiresAt: finalized.accessTokenExpiresAt ?? null,
        encryptedAccessToken: finalized.accessToken
          ? encryptToken(finalized.accessToken, env.brokerTokenEncryptionKey)
          : existing.encryptedAccessToken,
        encryptedRefreshToken: finalized.refreshToken
          ? encryptToken(finalized.refreshToken, env.brokerTokenEncryptionKey)
          : existing.encryptedRefreshToken,
        providerMetadata:
          (finalized.providerMetadata as Prisma.InputJsonValue | undefined) ??
          undefined
      },
    });

    await this.prisma.brokerAccount.createMany({
      data: finalized.providerAccounts.map((acc) => ({
        brokerConnectionId: updated.id,
        providerAccountId: acc.providerAccountId,
        name: acc.name,
        accountType: acc.accountType ?? null,
      })),
    });

    await this.enqueueSync(updated.id);

    return {
      brokerConnectionId: updated.id,
    };
  }

  async listConnections(userId: string) {
    const connections = await this.prisma.brokerConnection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      connections: connections.map((c) => ({
        id: c.id,
        provider: c.provider,
        status: c.status,
        lastSyncedAt: c.lastSyncedAt,
        lastSyncStatus: c.lastSyncStatus,
        authExpiresAt: c.authExpiresAt,
        revokedAt: c.revokedAt
      })),
    };
  }

  async disconnect(userId: string, connectionId: string) {
    const existing = await this.prisma.brokerConnection.findFirst({
      where: { id: connectionId, userId },
    });
    if (!existing) throw new NotFoundException('Connection not found');

    const provider = this.resolveProvider(existing.provider);
    const accessToken = decryptToken(
      existing.encryptedAccessToken,
      env.brokerTokenEncryptionKey
    );
    await this.withProviderErrorHandling(
      () =>
        provider.revokeConnection(
          userId,
          existing.providerConnectionId,
          accessToken
        ),
      existing.provider
    );

    await this.prisma.portfolioSnapshot.deleteMany({
      where: { brokerConnectionId: existing.id },
    });

    await this.prisma.riskSnapshot.deleteMany({
      where: { brokerConnectionId: existing.id },
    });

    await this.prisma.brokerAccount.deleteMany({
      where: { brokerConnectionId: existing.id },
    });

    await this.prisma.brokerConnection.delete({
      where: { id: existing.id },
    });

    return { ok: true, removedConnectionId: existing.id };
  }

  async listSyncRuns(userId: string, connectionId: string) {
    const existing = await this.prisma.brokerConnection.findFirst({
      where: { id: connectionId, userId },
      select: { id: true }
    });
    if (!existing) throw new NotFoundException("Connection not found");

    const runs = await this.prisma.brokerSyncRun.findMany({
      where: { brokerConnectionId: connectionId },
      orderBy: { startedAt: "desc" },
      take: 25
    });
    return { runs };
  }

  listSupportedProviders() {
    const labelMap: Record<string, string> = {
      snaptrade: "Snaptrade",
      fidelity: "Fidelity",
      schwab: "Schwab",
      robinhood: "Robinhood",
      trading212: "Trading 212"
    };
    return {
      providers: Object.keys(this.providers).map((name) => ({
        id: name,
        label: labelMap[name] ?? (name.charAt(0).toUpperCase() + name.slice(1))
      }))
    };
  }

  private async enqueueSync(brokerConnectionId: string) {
    // MVP: run broker sync synchronously (no background queue).
    const run = await this.prisma.brokerSyncRun.create({
      data: {
        brokerConnectionId,
        trigger: "connect_finalize",
        status: "running"
      }
    });
    await this.prisma.brokerConnection.update({
      where: { id: brokerConnectionId },
      data: { lastSyncAttemptAt: new Date(), lastSyncStatus: "running" }
    });
    try {
      await syncBrokerOnce(this.prisma, brokerConnectionId);
      await this.prisma.brokerSyncRun.update({
        where: { id: run.id },
        data: {
          status: "succeeded",
          completedAt: new Date(),
          errorMessage: null
        }
      });
      await this.prisma.brokerConnection.update({
        where: { id: brokerConnectionId },
        data: { lastSyncStatus: "succeeded", lastSyncError: null }
      });
    } catch (error: any) {
      this.logger.error(
        `Broker sync failed for ${brokerConnectionId}: ${error?.message ?? String(error)}`
      );
      await this.prisma.brokerConnection.update({
        where: { id: brokerConnectionId },
        data: {
          lastSyncStatus: "failed",
          lastSyncError: error?.message ?? "Sync failed"
        }
      });
      await this.prisma.brokerSyncRun.update({
        where: { id: run.id },
        data: {
          status: "failed",
          completedAt: new Date(),
          errorMessage: error?.message ?? "Sync failed"
        }
      });
      throw error;
    }
  }

  private resolveProvider(providerName: string): BrokerProvider {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new BadRequestException(
        `Unsupported broker provider: ${providerName}`
      );
    }
    return provider;
  }

  private async withProviderErrorHandling<T>(
    run: () => Promise<T>,
    providerName: string
  ): Promise<T> {
    try {
      return await run();
    } catch (error: any) {
      const providerError = error as BrokerProviderError;
      const code = providerError?.code ?? "UNKNOWN";
      this.logger.warn(
        `Provider ${providerName} request failed (${code}): ${error?.message ?? String(error)}`
      );

      if (code === "INVALID_TOKEN") {
        throw new BadRequestException("Broker authorization token is invalid or expired.");
      }
      if (code === "RATE_LIMITED") {
        throw new ServiceUnavailableException(
          "Broker provider rate limit reached. Please retry shortly."
        );
      }
      if (code === "MFA_REQUIRED") {
        throw new BadRequestException(
          "Additional provider authentication is required before sync."
        );
      }

      throw new ServiceUnavailableException(
        `Broker provider (${providerName}) is currently unavailable.`
      );
    }
  }
}
