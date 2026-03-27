import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CoachAiService } from '../ai/coach-ai.service';
import { generateWeeklyBriefOnce } from '../workers/generate-brief.worker';

type FeedbackType = 'helpful' | 'dismissed' | 'not_relevant';
type ActionPlan = {
  title: string;
  steps: string[];
};

@Injectable()
export class CoachService {
  private readonly logger = new Logger(CoachService.name);
  private readonly ai = new CoachAiService();

  constructor(private readonly prisma: PrismaService) {}

  async getFeed(userId: string) {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const existing = await this.prisma.coachRecommendation.findMany({
      where: {
        userId,
        createdAt: { gte: sixHoursAgo },
        dismissedAt: null,
        NOT: {
          feedback: {
            is: {
              feedbackType: 'not_relevant',
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { feedback: true },
    });

    if (existing.length > 0) {
      return {
        feed: existing.map((rec) => this.formatFeedItem(rec)),
      };
    }

    const latestRiskSnapshot = await this.prisma.riskSnapshot.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { alerts: true },
    });

    if (!latestRiskSnapshot)
      throw new NotFoundException('No risk snapshot found');

    const prefs = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });
    const riskTolerance = prefs?.riskTolerance ?? 'moderate';
    const horizon = prefs?.timeHorizon ?? '5_10_years';
    const volatilityComfort = prefs?.volatilityComfort ?? 'medium';
    const goal = prefs?.goalType ?? 'wealth_growth';
    const feedbackContext = await this.buildFeedbackContext(userId);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const tradeCount7d = await this.prisma.transaction.count({
      where: { userId, date: { gte: sevenDaysAgo } },
    });

    const tradeCount30dBaseline = await this.prisma.transaction.count({
      where: { userId, date: { gte: thirtyDaysAgo } },
    });

    const buyCount30d = await this.prisma.transaction.count({
      where: { userId, date: { gte: thirtyDaysAgo }, transactionType: 'BUY' },
    });

    const sellCount30d = await this.prisma.transaction.count({
      where: { userId, date: { gte: thirtyDaysAgo }, transactionType: 'SELL' },
    });

    const avgHoldPeriodDays = 4 + (sellCount30d > 0 ? 1 : 0);
    const soldAfterDropEvents = Math.min(
      10,
      Math.max(0, Math.floor(sellCount30d / 3)),
    );

    const marketRegime =
      latestRiskSnapshot.volatilityEstimate > 0.35
        ? 'high_volatility'
        : 'normal_volatility';

    let behaviorOutput: {
      pattern_detected: string;
      coaching_message: string;
      next_step_checklist: string[];
      confidence: number;
    };
    try {
      behaviorOutput = await this.ai.generateBehavioralCoaching({
        profile: { risk_tolerance: riskTolerance, goal },
        behavior_signals: {
          trade_count_7d: tradeCount7d,
          trade_count_30d_baseline: Math.max(1, tradeCount30dBaseline),
          avg_hold_period_days: avgHoldPeriodDays,
          sold_after_drop_events: soldAfterDropEvents,
        },
        context: { market_regime: marketRegime },
        feedback_context: feedbackContext,
      });
    } catch (error) {
      this.logger.warn(
        'Behavior coaching AI unavailable, using fallback template.',
      );
      behaviorOutput = this.buildBehaviorFallback({
        tradeCount7d,
        tradeCount30dBaseline,
        soldAfterDropEvents,
        marketRegime,
        feedbackContext,
      });
    }

    const behaviorRec = await this.prisma.coachRecommendation.create({
      data: {
        userId,
        recommendationType: 'behavior_pattern',
        title: behaviorOutput.pattern_detected,
        content: {
          issue: behaviorOutput.pattern_detected,
          why: behaviorOutput.coaching_message,
          suggestedNextStep:
            behaviorOutput.next_step_checklist[0] ??
            'Review and adjust your plan',
          confidence: behaviorOutput.confidence,
          possibleDownside:
            'Frequent activity can increase costs and may reduce alignment with your time horizon.',
        },
      },
    });

    const maxSingleHolding =
      riskTolerance === 'conservative'
        ? 0.15
        : riskTolerance === 'aggressive'
          ? 0.25
          : 0.2;
    const maxSectorWeight =
      riskTolerance === 'conservative'
        ? 0.25
        : riskTolerance === 'aggressive'
          ? 0.45
          : 0.35;

    const riskRecs = await Promise.all(
      latestRiskSnapshot.alerts.map(async (alert) => {
        try {
          const output = await this.ai.generateRiskExplanation({
            user_profile: {
              risk_tolerance: riskTolerance,
              time_horizon: horizon,
              volatility_comfort: volatilityComfort,
              goal,
            },
            risk_metrics: {
              top_holding_weight: latestRiskSnapshot.topHoldingWeight,
              sector_tech_weight: latestRiskSnapshot.sectorConcentration,
              portfolio_volatility_est: latestRiskSnapshot.volatilityEstimate,
              diversification_score: latestRiskSnapshot.diversificationScore,
            },
            thresholds: {
              max_single_holding: maxSingleHolding,
              max_sector_weight: maxSectorWeight,
            },
            risk_alert_title: alert.title,
            feedback_context: feedbackContext,
          });

          return this.prisma.coachRecommendation.create({
            data: {
              userId,
              recommendationType: 'risk_nudge',
              title: output.title,
              content: {
                issue: output.title,
                why: output.why_it_matters,
                suggestedNextStep: output.suggested_action,
                confidence: output.confidence,
                possibleDownside: output.possible_downside,
                assumptions: output.assumptions,
                severity: output.severity,
                riskAlertId: alert.id,
              },
            },
          });
        } catch (error) {
          this.logger.warn(
            `Risk coaching AI unavailable for alert ${alert.id}, using fallback template.`,
          );
          const fallback = this.buildRiskFallback({
            alertTitle: alert.title,
            alertDescription: alert.description,
          });
          return this.prisma.coachRecommendation.create({
            data: {
              userId,
              recommendationType: 'risk_nudge',
              title: fallback.title,
              content: {
                issue: fallback.title,
                why: fallback.whyItMatters,
                suggestedNextStep: fallback.suggestedAction,
                confidence: fallback.confidence,
                possibleDownside: fallback.possibleDownside,
                assumptions: fallback.assumptions,
                severity: fallback.severity,
                riskAlertId: alert.id,
              },
            },
          });
        }
      }),
    );

    const feed = [behaviorRec, ...riskRecs].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    return {
      feed: feed.map((rec) => this.formatFeedItem(rec)),
    };
  }

  async getDislikedFeed(userId: string) {
    const disliked = await this.prisma.coachRecommendation.findMany({
      where: {
        userId,
        dismissedAt: null,
        feedback: {
          is: {
            feedbackType: 'not_relevant',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: { feedback: true },
      take: 100,
    });

    return {
      feed: disliked.map((rec) => this.formatFeedItem(rec)),
    };
  }

  async submitFeedback(
    userId: string,
    recommendationId: string,
    dto: { feedbackType: string; notes?: string },
  ) {
    const rec = await this.prisma.coachRecommendation.findFirst({
      where: { id: recommendationId, userId },
    });
    if (!rec) throw new NotFoundException('Recommendation not found');

    const feedbackType = dto.feedbackType as FeedbackType;
    if (!['helpful', 'dismissed', 'not_relevant'].includes(feedbackType)) {
      throw new BadRequestException('Invalid feedbackType');
    }

    await this.prisma.recommendationFeedback.upsert({
      where: { recommendationId },
      update: { feedbackType, notes: dto.notes },
      create: { recommendationId, userId, feedbackType, notes: dto.notes },
    });

    if (feedbackType === 'dismissed') {
      await this.prisma.coachRecommendation.update({
        where: { id: recommendationId },
        data: { dismissedAt: new Date() },
      });
      return { ok: true, dismissed: true };
    }

    if (feedbackType === 'helpful') {
      const actionPlan = await this.buildActionPlan(userId, rec);
      return { ok: true, actionPlan };
    }

    return { ok: true };
  }

  async undoDismiss(userId: string, recommendationId: string) {
    const rec = await this.prisma.coachRecommendation.findFirst({
      where: { id: recommendationId, userId },
      include: { feedback: true },
    });
    if (!rec) throw new NotFoundException('Recommendation not found');

    await this.prisma.coachRecommendation.update({
      where: { id: recommendationId },
      data: { dismissedAt: null },
    });

    if (rec.feedback?.feedbackType === 'dismissed') {
      await this.prisma.recommendationFeedback.delete({
        where: { recommendationId },
      });
    }

    const restored = await this.prisma.coachRecommendation.findUnique({
      where: { id: recommendationId },
      include: { feedback: true },
    });

    return {
      ok: true,
      recommendation: restored ? this.formatFeedItem(restored) : null,
    };
  }

  async generateBriefNow(userId: string) {
    const brief = await generateWeeklyBriefOnce(this.prisma, userId);
    return brief;
  }

  async getLatestBrief(userId: string) {
    const brief = await this.prisma.weeklyBrief.findFirst({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
    });
    if (!brief) throw new NotFoundException('No weekly brief found yet');

    return {
      id: brief.id,
      generatedAt: brief.generatedAt,
      summary: brief.summary,
      topChanges: brief.topChanges,
      risksToWatch: brief.risksToWatch,
      recommendedActions: brief.recommendedActions,
    };
  }

  private formatFeedItem(rec: {
    id: string;
    recommendationType: string;
    title: string;
    content: any;
    createdAt: Date;
    feedback?: { feedbackType: string } | null;
  }) {
    const c = rec.content ?? {};
    return {
      id: rec.id,
      kind: rec.recommendationType,
      issue: c.issue ?? rec.title,
      why: c.why ?? '',
      suggestedNextStep: c.suggestedNextStep ?? '',
      confidence: c.confidence ?? null,
      possibleDownside: c.possibleDownside ?? null,
      createdAt: rec.createdAt,
      feedbackType: rec.feedback?.feedbackType ?? null,
    };
  }

  private async buildFeedbackContext(userId: string) {
    const recentFeedback = await this.prisma.recommendationFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { recommendation: true },
    });

    const helpful = recentFeedback
      .filter((f) => f.feedbackType === 'helpful')
      .map((f) => ({
        type: f.recommendation.recommendationType,
        title: f.recommendation.title,
      }));
    const notRelevant = recentFeedback
      .filter((f) => f.feedbackType === 'not_relevant')
      .map((f) => ({
        type: f.recommendation.recommendationType,
        title: f.recommendation.title,
      }));

    return {
      prefer_patterns: helpful.slice(0, 6),
      avoid_patterns: notRelevant.slice(0, 6),
      helpful_count: helpful.length,
      not_relevant_count: notRelevant.length,
    };
  }

  private buildBehaviorFallback(input: {
    tradeCount7d: number;
    tradeCount30dBaseline: number;
    soldAfterDropEvents: number;
    marketRegime: string;
    feedbackContext?: {
      helpful_count?: number;
      not_relevant_count?: number;
      prefer_patterns?: Array<{ type: string; title: string }>;
    };
  }) {
    const elevatedTrading =
      input.tradeCount7d >
      Math.max(3, Math.round(input.tradeCount30dBaseline / 4));
    const patternDetected = elevatedTrading
      ? 'Trading activity recently increased'
      : 'Behavior remains broadly steady';
    const feedbackBias =
      (input.feedbackContext?.helpful_count ?? 0) >
      (input.feedbackContext?.not_relevant_count ?? 0)
        ? ' Based on your helpful feedback, we will continue prioritizing nudges in the themes you engage with.'
        : '';
    const coachingMessage = elevatedTrading
      ? 'Recent activity is above your recent baseline. Consider checking whether each trade still aligns with your plan and risk profile.'
      : 'Your recent activity is close to baseline. Keep decisions anchored to your target allocation and time horizon.';
    const checklist =
      input.marketRegime === 'high_volatility'
        ? [
            'Review your written rules before placing a trade',
            'Reduce position changes during high-volatility sessions',
            'Rebalance to target weights instead of chasing moves',
          ]
        : [
            'Review top portfolio drifts once this week',
            'Validate each trade against your target plan',
            'Set one portfolio rule and follow it for 30 days',
          ];
    const confidence = input.soldAfterDropEvents > 0 ? 0.62 : 0.56;
    return {
      pattern_detected: patternDetected,
      coaching_message: `${coachingMessage}${feedbackBias}`,
      next_step_checklist: checklist,
      confidence,
    };
  }

  private buildRiskFallback(input: {
    alertTitle: string;
    alertDescription: string;
  }) {
    return {
      title: input.alertTitle || 'Risk concentration to review',
      whyItMatters:
        input.alertDescription ||
        'Current positioning may increase drawdown risk relative to your target profile.',
      suggestedAction:
        'Consider trimming concentrated exposure and rebalancing toward your target allocation.',
      confidence: 0.58,
      possibleDownside:
        'Acting too quickly can create unnecessary turnover and tax impact.',
      assumptions: ['Portfolio snapshot reflects current exposure'],
      severity: 'medium',
    };
  }

  private async buildActionPlan(
    userId: string,
    rec: {
      recommendationType: string;
      title: string;
      content: any;
    },
  ): Promise<ActionPlan> {
    const content = rec.content ?? {};
    const suggested = content.suggestedNextStep as string | undefined;

    if (rec.recommendationType === 'risk_nudge') {
      return this.buildRiskActionPlan(userId, rec.title, suggested);
    }

    return {
      title: 'Suggested next steps',
      steps: [
        suggested ??
          'Review this recommendation and translate it into one concrete rule for your next week of trading.',
        'Write your target allocation before making changes, then compare every proposed trade against that target.',
        'If your risk comfort has changed, update onboarding preferences so future coaching aligns with your goals.',
      ],
    };
  }

  private async buildRiskActionPlan(
    userId: string,
    recommendationTitle: string,
    suggestedStep?: string,
  ): Promise<ActionPlan> {
    const prefs = await this.prisma.userPreferences.findUnique({ where: { userId } });
    const maxSingleHolding =
      prefs?.riskTolerance === 'conservative'
        ? 15
        : prefs?.riskTolerance === 'aggressive'
          ? 25
          : 20;

    const latestSnapshot = await this.prisma.portfolioSnapshot.findFirst({
      where: { userId },
      orderBy: { asOf: 'desc' },
      include: {
        positions: {
          orderBy: { marketValue: 'desc' },
          take: 1,
        },
      },
    });

    const topHolding = latestSnapshot?.positions?.[0];
    const topHoldingStep = topHolding
      ? `Trim holdings above your comfort range (for example, ${topHolding.symbol} currently at ${(topHolding.weight * 100).toFixed(1)}%).`
      : `Trim holdings above your comfort range (target: <= ${maxSingleHolding}% per single position).`;

    const title = /concentration|single holding|sector/i.test(recommendationTitle)
      ? 'Concentration action plan'
      : 'Risk action plan';

    return {
      title,
      steps: [
        suggestedStep ??
          `Set a hard cap of ${maxSingleHolding}% per holding and rebalance positions above it in stages.`,
        topHoldingStep,
        'If concentration is intentional, update your risk comfort settings in onboarding so recommendations match your strategy.',
      ],
    };
  }
}
