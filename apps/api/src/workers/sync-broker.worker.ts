import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const symbols = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "TSLA", "META", "AMD"];
const sectors = ["Tech", "Semiconductors", "Consumer", "Cloud", "AI", "Retail", "Media", "Hardware"];

const sha256Bytes = (value: string): Buffer => {
  return crypto.createHash("sha256").update(value).digest();
};

const byteToUnit = (b: number): number => b / 255;

const pick = <T,>(arr: T[], idx: number): T => arr[idx % arr.length];

export const syncBrokerOnce = async (prisma: PrismaClient, brokerConnectionId: string) => {
  const brokerConnection = await prisma.brokerConnection.findUnique({
    where: { id: brokerConnectionId }
  });
  if (!brokerConnection || brokerConnection.status !== "connected") return;

  const userId = brokerConnection.userId;
  const hash = sha256Bytes(brokerConnectionId);

  const totalValue =
    10000 + Math.floor(hash.readUInt32BE(0) % 45000) + Math.floor(byteToUnit(hash[4]) * 1000);
  const cash = totalValue * 0.1;
  const investedValue = totalValue - cash;

  const weightsRaw = new Array(5).fill(0).map((_, i) => 0.05 + byteToUnit(hash[i + 5]) * 0.25);
  const rawSum = weightsRaw.reduce((a, b) => a + b, 0);
  const weights = weightsRaw.map((w) => w / rawSum);

  const now = new Date();

  const positions = weights.map((w, i) => {
    const sector = pick(sectors, i + hash[i + 15]);
    const symbol = pick(symbols, i + hash[i + 3]);
    const marketValue = investedValue * w;
    const pnlPct = (byteToUnit(hash[i + 25]) - 0.5) * 0.1; // -5%..+5%
    const unrealizedPnL = marketValue * pnlPct;
    return { symbol, sector, weight: w, marketValue, unrealizedPnL };
  });

  const totalPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);

  const transactions = new Array(24).fill(0).map((_, i) => {
    const symbol = pick(symbols, i + hash[i + 40]);
    const date = new Date(Date.now() - (i * 3 + hash[i % 10]) * 24 * 60 * 60 * 1000);
    const isBuy = hash[i + 50] % 2 === 0;
    const base = investedValue * 0.0025;
    const amountMag = base * (1 + byteToUnit(hash[i + 60]));
    const amount = isBuy ? amountMag : -amountMag;
    const transactionType = isBuy ? "BUY" : "SELL";
    return { date, symbol, transactionType, amount, description: `${transactionType} ${symbol}` };
  });

  const portfolioSnapshot = await prisma.portfolioSnapshot.create({
    data: {
      brokerConnectionId: brokerConnection.id,
      userId,
      asOf: now,
      totalValue,
      totalPnL,
      cash,
      accountCount: 1,
      positions: {
        create: positions.map((p) => ({
          symbol: p.symbol,
          sector: p.sector,
          weight: p.weight,
          marketValue: p.marketValue,
          unrealizedPnL: p.unrealizedPnL
        }))
      },
      transactions: {
        create: transactions.map((t) => ({
          brokerConnectionId: brokerConnection.id,
          userId,
          date: t.date,
          symbol: t.symbol,
          transactionType: t.transactionType,
          amount: t.amount,
          description: t.description
        }))
      }
    }
  });

  const topHoldingWeight = positions.reduce((m, p) => Math.max(m, p.weight), 0);
  const sectorWeights = positions.reduce<Record<string, number>>((acc, p) => {
    const key = p.sector ?? "Unknown";
    acc[key] = (acc[key] ?? 0) + p.weight;
    return acc;
  }, {});
  const sectorConcentration = Object.values(sectorWeights).reduce((m, v) => Math.max(m, v), 0);
  const sumSquares = positions.reduce((sum, p) => sum + p.weight * p.weight, 0);
  const diversificationScore = Math.max(0, Math.min(1, 1 - sumSquares * 2));

  const volRand = byteToUnit(hash[90] ?? hash[hash.length - 1]);
  const volatilityEstimate = Math.max(
    0,
    Math.min(1, 0.15 + (1 - diversificationScore) * 0.45 + volRand * 0.15)
  );
  const drawdownEstimate = Math.max(
    0,
    Math.min(1, volatilityEstimate * 1.25 + (1 - diversificationScore) * 0.05)
  );
  const concentrationScore = Math.max(0, Math.min(1, topHoldingWeight / 0.28));

  const riskSnapshot = await prisma.riskSnapshot.create({
    data: {
      userId,
      brokerConnectionId: brokerConnection.id,
      portfolioSnapshotId: portfolioSnapshot.id,
      concentrationScore,
      sectorConcentration,
      topHoldingWeight,
      volatilityEstimate,
      drawdownEstimate,
      diversificationScore
    }
  });

  const prefs = await prisma.userPreferences.findUnique({ where: { userId } });
  const riskTolerance = prefs?.riskTolerance ?? "moderate";
  const maxSingleHolding =
    riskTolerance === "conservative" ? 0.15 : riskTolerance === "aggressive" ? 0.25 : 0.2;
  const maxSectorWeight =
    riskTolerance === "conservative" ? 0.25 : riskTolerance === "aggressive" ? 0.45 : 0.35;
  const volatilityComfort = prefs?.volatilityComfort ?? "medium";
  const maxVol = volatilityComfort === "low" ? 0.25 : volatilityComfort === "high" ? 0.45 : 0.35;

  const assumptions = ["Current market values", "No hedging positions detected"];
  const alerts: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
    confidence: number;
    possibleDownside?: string;
  }> = [];

  if (topHoldingWeight > maxSingleHolding) {
    const excessRatio = (topHoldingWeight - maxSingleHolding) / maxSingleHolding;
    alerts.push({
      type: "single_asset_concentration",
      severity: excessRatio > 0.25 ? "high" : "medium",
      title: "Single holding concentration is high",
      description: `Your largest holding is ${(topHoldingWeight * 100).toFixed(1)}% of the portfolio, above your comfort range.`,
      confidence: Math.max(0.6, Math.min(0.98, 0.75 + excessRatio * 0.3)),
      possibleDownside: "Higher concentration can increase portfolio downside sensitivity to a single name."
    });
  }

  if (sectorConcentration > maxSectorWeight) {
    const excessRatio = (sectorConcentration - maxSectorWeight) / maxSectorWeight;
    alerts.push({
      type: "sector_concentration",
      severity: excessRatio > 0.25 ? "high" : "medium",
      title: "Sector concentration is high",
      description: `Top sector exposure is ${(sectorConcentration * 100).toFixed(1)}% of the portfolio, above your comfort range.`,
      confidence: Math.max(0.6, Math.min(0.98, 0.7 + excessRatio * 0.25)),
      possibleDownside: "Sector concentration can increase risk during sector-specific drawdowns."
    });
  }

  if (diversificationScore < 0.4) {
    const deficit = (0.4 - diversificationScore) / 0.4;
    alerts.push({
      type: "low_diversification",
      severity: deficit > 0.25 ? "medium" : "low",
      title: "Diversification could be improved",
      description: "Portfolio weights are more concentrated than a typical diversified allocation.",
      confidence: Math.max(0.6, Math.min(0.98, 0.7 + deficit * 0.2)),
      possibleDownside: "Lower diversification can amplify the impact of valuation swings across holdings."
    });
  }

  if (volatilityEstimate > maxVol) {
    const excessRatio = (volatilityEstimate - maxVol) / maxVol;
    alerts.push({
      type: "volatility_estimate_high",
      severity: excessRatio > 0.25 ? "high" : "medium",
      title: "Estimated volatility is elevated",
      description: `Volatility estimate is ${volatilityEstimate.toFixed(2)} and is above your comfort level.`,
      confidence: Math.max(0.6, Math.min(0.98, 0.75 + excessRatio * 0.25)),
      possibleDownside: "Higher volatility can make drawdowns more frequent and harder to tolerate."
    });
  }

  if (alerts.length > 0) {
    await prisma.riskAlert.createMany({
      data: alerts.map((a) => ({
        userId,
        riskSnapshotId: riskSnapshot.id,
        type: a.type,
        severity: a.severity,
        title: a.title,
        description: a.description,
        confidence: a.confidence,
        assumptions,
        possibleDownside: a.possibleDownside ?? null
      }))
    });
  }

  await prisma.brokerConnection.update({
    where: { id: brokerConnection.id },
    data: { lastSyncedAt: new Date(), lastSyncError: null }
  });
};

