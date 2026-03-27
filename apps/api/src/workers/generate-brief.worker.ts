import { PrismaClient } from "@prisma/client";
import { CoachAiService } from "../ai/coach-ai.service";

export type GeneratedBrief = {
  id: string;
  generatedAt: Date;
  summary: string;
  topChanges: unknown;
  risksToWatch: unknown;
  recommendedActions: unknown;
};

export const generateWeeklyBriefOnce = async (
  prisma: PrismaClient,
  userId: string
): Promise<GeneratedBrief> => {
  const latestRisk = await prisma.riskSnapshot.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { alerts: true }
  });
  if (!latestRisk) throw new Error("No risk snapshot to generate weekly brief");

  const previousRisk = await prisma.riskSnapshot.findFirst({
    where: { userId, createdAt: { lt: latestRisk.createdAt } },
    orderBy: { createdAt: "desc" }
  });

  const latestPortfolio = await prisma.portfolioSnapshot.findFirst({
    where: { userId },
    orderBy: { asOf: "desc" }
  });

  const previousPortfolio = latestPortfolio
    ? await prisma.portfolioSnapshot.findFirst({
        where: { userId, asOf: { lt: latestPortfolio.asOf } },
        orderBy: { asOf: "desc" }
      })
    : null;

  const prefs = await prisma.userPreferences.findUnique({ where: { userId } });
  const riskTolerance = prefs?.riskTolerance ?? "moderate";
  const horizon = prefs?.timeHorizon ?? "5_10_years";

  const week_over_week_changes: string[] = [];
  if (previousRisk) {
    const dh = latestRisk.topHoldingWeight - previousRisk.topHoldingWeight;
    const ds = latestRisk.sectorConcentration - previousRisk.sectorConcentration;
    const dv = latestRisk.volatilityEstimate - previousRisk.volatilityEstimate;
    week_over_week_changes.push(
      `Top holding weight changed by ${(dh * 100).toFixed(1)}%`,
      `Sector concentration changed by ${(ds * 100).toFixed(1)}%`,
      `Volatility estimate changed by ${(dv * 100).toFixed(1)}%`
    );
  } else {
    week_over_week_changes.push("Portfolio risk metrics were refreshed from the latest sync");
  }

  const active_alerts = latestRisk.alerts.map((a) => a.title);
  const value_change_pct =
    latestPortfolio && previousPortfolio
      ? (latestPortfolio.totalValue - previousPortfolio.totalValue) /
        Math.max(1, previousPortfolio.totalValue)
      : 0;

  const ai = new CoachAiService();
  const brief = await ai.generateWeeklyBrief({
    week_over_week_changes,
    active_alerts,
    user_profile: { risk_tolerance: riskTolerance, horizon },
    portfolio_stats: { value_change_pct, top_holding_weight: latestRisk.topHoldingWeight }
  });

  const record = await prisma.weeklyBrief.create({
    data: {
      userId,
      brokerConnectionId: latestRisk.brokerConnectionId,
      summary: brief.summary,
      topChanges: brief.top_changes,
      risksToWatch: brief.risks_to_watch,
      recommendedActions: brief.recommended_actions
    }
  });

  return {
    id: record.id,
    generatedAt: record.generatedAt,
    summary: record.summary,
    topChanges: record.topChanges,
    risksToWatch: record.risksToWatch,
    recommendedActions: record.recommendedActions
  };
};

