import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import type { JwtAuthUser } from "../auth/jwt/jwt.strategy";
import { CoachService } from "./coach.service";
import { RecommendationFeedbackDto } from "./dto/recommendation-feedback.dto";

@Controller("/api/v1/coach")
export class CoachController {
  constructor(private readonly coach: CoachService) {}

  @Get("/feed")
  @UseGuards(JwtAuthGuard)
  feed(@Req() req: Request) {
    const user = req.user as JwtAuthUser;
    return this.coach.getFeed(user.userId);
  }

  @Get("/disliked")
  @UseGuards(JwtAuthGuard)
  disliked(@Req() req: Request) {
    const user = req.user as JwtAuthUser;
    return this.coach.getDislikedFeed(user.userId);
  }

  @Post("/recommendations/:id/feedback")
  @UseGuards(JwtAuthGuard)
  feedback(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: RecommendationFeedbackDto
  ) {
    const user = req.user as JwtAuthUser;
    return this.coach.submitFeedback(user.userId, id, dto);
  }

  @Post("/recommendations/:id/undo-dismiss")
  @UseGuards(JwtAuthGuard)
  undoDismiss(@Req() req: Request, @Param("id") id: string) {
    const user = req.user as JwtAuthUser;
    return this.coach.undoDismiss(user.userId, id);
  }

  @Post("/brief/generate")
  @UseGuards(JwtAuthGuard)
  generateBrief(@Req() req: Request) {
    const user = req.user as JwtAuthUser;
    return this.coach.generateBriefNow(user.userId);
  }

  @Get("/brief/latest")
  @UseGuards(JwtAuthGuard)
  latestBrief(@Req() req: Request) {
    const user = req.user as JwtAuthUser;
    return this.coach.getLatestBrief(user.userId);
  }
}

