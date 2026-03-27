import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type RiskRange = "30d" | "90d" | "1y";

const toRange = (value?: string): RiskRange => {
  if (!value) return "90d";
  if (value === "30d" || value === "90d" || value === "1y") return value;
  throw new BadRequestException("range must be one of: 30d, 90d, 1y");
};

@Injectable()
export class RiskService {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestSnapshot(userId: string) {
    const snap = await this.prisma.riskSnapshot.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { alerts: true }
    });

    if (!snap) throw new NotFoundException("No risk snapshot found");

    return {
      riskSnapshotId: snap.id,
      createdAt: snap.createdAt,
      concentrationScore: snap.concentrationScore,
      sectorConcentration: snap.sectorConcentration,
      topHoldingWeight: snap.topHoldingWeight,
      volatilityEstimate: snap.volatilityEstimate,
      drawdownEstimate: snap.drawdownEstimate,
      diversificationScore: snap.diversificationScore
    };
  }

  async getHistory(userId: string, range?: string) {
    const r = toRange(range);
    const now = new Date();
    const from =
      r === "30d"
        ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        : r === "90d"
          ? new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          : new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const snaps = await this.prisma.riskSnapshot.findMany({
      where: { userId, createdAt: { gte: from } },
      orderBy: { createdAt: "asc" }
    });

    return {
      range: r,
      series: snaps.map((s) => ({
        createdAt: s.createdAt,
        concentrationScore: s.concentrationScore,
        sectorConcentration: s.sectorConcentration,
        topHoldingWeight: s.topHoldingWeight,
        volatilityEstimate: s.volatilityEstimate,
        drawdownEstimate: s.drawdownEstimate,
        diversificationScore: s.diversificationScore
      }))
    };
  }

  async getAlerts(userId: string) {
    const latest = await this.prisma.riskSnapshot.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    if (!latest) throw new NotFoundException("No risk snapshot found");

    const alerts = await this.prisma.riskAlert.findMany({
      where: { userId, riskSnapshotId: latest.id },
      orderBy: { createdAt: "desc" }
    });

    return {
      riskSnapshotId: latest.id,
      alerts: alerts.map((a) => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        title: a.title,
        description: a.description,
        confidence: a.confidence,
        assumptions: a.assumptions,
        createdAt: a.createdAt,
        possibleDownside: a.possibleDownside ?? null
      }))
    };
  }
}

