import OpenAI from "openai";
import { z } from "zod";

const RiskExplanationSchema = z.object({
  title: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  why_it_matters: z.string(),
  suggested_action: z.string(),
  confidence: z.number().min(0).max(1),
  assumptions: z.array(z.string()),
  possible_downside: z.string()
});

type RiskExplanation = z.infer<typeof RiskExplanationSchema>;

const BehavioralCoachingSchema = z.object({
  pattern_detected: z.string(),
  evidence: z.array(z.string()),
  coaching_message: z.string(),
  next_step_checklist: z.array(z.string()),
  confidence: z.number().min(0).max(1)
});

type BehavioralCoaching = z.infer<typeof BehavioralCoachingSchema>;

const WeeklyBriefSchema = z.object({
  summary: z.string(),
  top_changes: z.array(z.string()),
  risks_to_watch: z.array(z.string()),
  recommended_actions: z.array(
    z.object({
      action: z.string(),
      why: z.string(),
      confidence: z.number().min(0).max(1),
      possible_downside: z.string()
    })
  )
});

type WeeklyBrief = z.infer<typeof WeeklyBriefSchema>;

export class CoachAiService {
  private readonly openai?: OpenAI;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
    this.model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  }

  async generateRiskExplanation(input: {
    user_profile: {
      risk_tolerance: string;
      time_horizon: string;
      volatility_comfort: string;
      goal: string;
    };
    risk_metrics: {
      top_holding_weight: number;
      sector_tech_weight: number;
      portfolio_volatility_est: number;
      diversification_score: number;
    };
    thresholds: {
      max_single_holding: number;
      max_sector_weight: number;
    };
    risk_alert_title?: string;
    feedback_context?: {
      prefer_patterns?: Array<{ type: string; title: string }>;
      avoid_patterns?: Array<{ type: string; title: string }>;
      helpful_count?: number;
      not_relevant_count?: number;
    };
  }): Promise<RiskExplanation> {
    if (!this.openai) return this.fallbackRiskExplanation(input);

    const systemPrompt = `You are an investment risk explanation assistant.
You never provide direct trade orders.
You provide educational, plain-English guidance.
Use cautious language, mention uncertainty, and avoid guarantees.
When feedback_context is present, lean toward patterns the user marked helpful and avoid patterns marked not relevant unless risk is materially elevated.
Return JSON that matches the given schema exactly.`;

    const userPrompt = `Input JSON:
${JSON.stringify(input, null, 2)}

Return output JSON only.`;

    const content = await this.requestJson(systemPrompt, userPrompt, RiskExplanationSchema);
    return content;
  }

  async generateBehavioralCoaching(input: {
    profile: { risk_tolerance: string; goal: string };
    behavior_signals: {
      trade_count_7d: number;
      trade_count_30d_baseline: number;
      avg_hold_period_days: number;
      sold_after_drop_events: number;
    };
    context: { market_regime: string };
    feedback_context?: {
      prefer_patterns?: Array<{ type: string; title: string }>;
      avoid_patterns?: Array<{ type: string; title: string }>;
      helpful_count?: number;
      not_relevant_count?: number;
    };
  }): Promise<BehavioralCoaching> {
    if (!this.openai) {
      return this.fallbackBehavioralCoaching(input);
    }

    const systemPrompt = `You are a behavioral investing coach.
Focus on patterns, not judgment.
No direct buy/sell commands.
Recommend process improvements and reflection steps.
When feedback_context is present, align nudges with patterns marked helpful and reduce suggestions similar to items marked not relevant.
Return JSON that matches the given schema exactly.`;

    const userPrompt = `Input JSON:
${JSON.stringify(input, null, 2)}

Return output JSON only.`;

    const content = await this.requestJson(systemPrompt, userPrompt, BehavioralCoachingSchema);
    return content;
  }

  async generateWeeklyBrief(input: {
    week_over_week_changes: string[];
    active_alerts: string[];
    user_profile: { risk_tolerance: string; horizon: string };
    portfolio_stats: { value_change_pct: number; top_holding_weight: number };
  }): Promise<WeeklyBrief> {
    if (!this.openai) return this.fallbackWeeklyBrief(input);

    const systemPrompt = `Generate a concise weekly investment decision brief.
Audience: retail investor.
Tone: calm, clear, practical.
No hype, no certainty language, no direct financial advice.
Return JSON that matches the given schema exactly.`;

    const userPrompt = `Input JSON:
${JSON.stringify(input, null, 2)}

Return output JSON only.`;

    const content = await this.requestJson(systemPrompt, userPrompt, WeeklyBriefSchema);
    return content;
  }

  private async requestJson<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodType<T>
  ): Promise<T> {
    const resp = await this.openai!.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2
    });

    const text = resp.choices[0]?.message?.content ?? "";
    const parsed = this.extractAndParseJson(text);
    return schema.parse(parsed);
  }

  private extractAndParseJson(text: string): unknown {
    // Handles cases where the model wraps JSON in text.
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("Model output was not valid JSON");
    }
    const json = text.slice(firstBrace, lastBrace + 1);
    return JSON.parse(json);
  }

  private fallbackRiskExplanation(input: any): RiskExplanation {
    const title = input.risk_alert_title ?? "Risk item detected";
    const severity: "low" | "medium" | "high" =
      input.risk_metrics.top_holding_weight > input.thresholds.max_single_holding ? "high" : "medium";

    return {
      title,
      severity,
      why_it_matters:
        "Your current allocation appears to be more concentrated than your configured comfort range.",
      suggested_action:
        "Consider reviewing position sizing and diversification. Focus on education and risk limits, not on trading signals.",
      confidence: 0.78,
      assumptions: ["Current market values", "No hedging positions detected"],
      possible_downside:
        "If concentration increases further, downside may become harder to absorb during market drawdowns."
    };
  }

  private fallbackBehavioralCoaching(input: any): BehavioralCoaching {
    const t7 = input.behavior_signals.trade_count_7d;
    const t30 = input.behavior_signals.trade_count_30d_baseline;
    const increased = t30 > 0 ? t7 / t30 : 2;

    return {
      pattern_detected: increased > 2 ? "Turnover increased recently" : "Trading cadence is steady",
      evidence: [
        `Trades in last 7d: ${t7}`,
        `Baseline (30d metric): ${t30}`
      ],
      coaching_message:
        "Try to align transactions with your plan and time horizon. If activity increased due to noise, pause and reflect on whether the move matches your risk limits.",
      next_step_checklist: [
        "Review why trades happened (thesis vs. impulse).",
        "Compare current weights to your configured comfort range.",
        "Decide on a rule for when you will add, reduce, or wait."
      ],
      confidence: 0.72
    };
  }

  private fallbackWeeklyBrief(input: any): WeeklyBrief {
    return {
      summary:
        "This week’s key theme is portfolio risk concentration and whether your allocation stayed aligned with your comfort ranges.",
      top_changes: input.week_over_week_changes?.slice(0, 3) ?? [],
      risks_to_watch: input.active_alerts?.slice(0, 3) ?? [],
      recommended_actions: (input.active_alerts?.slice(0, 2) ?? []).map((a: string) => ({
        action: "Review allocation and risk limits",
        why: a,
        confidence: 0.76,
        possible_downside: "Concentration can increase drawdown sensitivity."
      }))
    };
  }
}

