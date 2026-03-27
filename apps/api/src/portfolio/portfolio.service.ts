import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  // Nest versions differ on whether TooManyRequestsException exists.
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { syncBrokerOnce } from "../workers/sync-broker.worker";

const parseDateOr = (value: string | undefined, fallback: Date): Date => {
  if (!value) return fallback;
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) throw new BadRequestException(`Invalid date: ${value}`);
  return parsedDate;
};

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string) {
    const snapshot = await this.prisma.portfolioSnapshot.findFirst({
      where: { userId },
      orderBy: { asOf: "desc" }
    });

    if (!snapshot) throw new NotFoundException("No portfolio has been synced yet");

    return {
      totalValue: snapshot.totalValue,
      totalPnL: snapshot.totalPnL,
      cash: snapshot.cash,
      accountCount: snapshot.accountCount,
      asOf: snapshot.asOf
    };
  }

  async getPositions(userId: string) {
    const snapshot = await this.prisma.portfolioSnapshot.findFirst({
      where: { userId },
      orderBy: { asOf: "desc" }
    });
    if (!snapshot) throw new NotFoundException("No portfolio has been synced yet");

    const positions = await this.prisma.positionSnapshot.findMany({
      where: { portfolioSnapshotId: snapshot.id },
      orderBy: { marketValue: "desc" }
    });

    return {
      positions: positions.map((position) => ({
        symbol: position.symbol,
        weight: position.weight,
        sector: position.sector,
        marketValue: position.marketValue,
        unrealizedPnL: position.unrealizedPnL
      }))
    };
  }

  async getTransactions(userId: string, from?: string, to?: string) {
    const fallbackFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fromDate = parseDateOr(from, fallbackFrom);
    const toDate = parseDateOr(to, new Date());

    if (fromDate > toDate) throw new BadRequestException("from must be <= to");

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: fromDate, lte: toDate }
      },
      orderBy: { date: "desc" }
    });

    return {
      transactions: transactions.map((transaction) => ({
        date: transaction.date,
        symbol: transaction.symbol,
        transactionType: transaction.transactionType,
        amount: transaction.amount,
        description: transaction.description
      }))
    };
  }

  async syncNow(userId: string) {
    const connection = await this.prisma.brokerConnection.findFirst({
      where: { userId, status: "connected" },
      orderBy: { createdAt: "desc" }
    });

    if (!connection) throw new NotFoundException("No connected brokerage found");

    // MVP rate limit: 60 seconds between syncs per connection.
    if (connection.lastSyncedAt) {
      const elapsedMs = Date.now() - connection.lastSyncedAt.getTime();
      if (elapsedMs < 60 * 1000) {
        throw new HttpException("Sync rate limit: try again shortly", HttpStatus.TOO_MANY_REQUESTS);
      }
    }

    // MVP: run sync immediately.
    await syncBrokerOnce(this.prisma, connection.id);
    return {
      ok: true,
      queued: false,
      brokerConnectionId: connection.id,
      requestedAt: new Date()
    };
  }
}

