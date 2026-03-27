import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import type { JwtAuthUser } from "../auth/jwt/jwt.strategy";
import { RiskService } from "./risk.service";

@Controller("/api/v1/risk")
export class RiskController {
  constructor(private readonly risk: RiskService) {}

  @Get("/snapshot")
  @UseGuards(JwtAuthGuard)
  snapshot(@Req() req: Request) {
    const user = req.user as JwtAuthUser;
    return this.risk.getLatestSnapshot(user.userId);
  }

  @Get("/history")
  @UseGuards(JwtAuthGuard)
  history(@Req() req: Request, @Query("range") range?: string) {
    const user = req.user as JwtAuthUser;
    return this.risk.getHistory(user.userId, range);
  }

  @Get("/alerts")
  @UseGuards(JwtAuthGuard)
  alerts(@Req() req: Request) {
    const user = req.user as JwtAuthUser;
    return this.risk.getAlerts(user.userId);
  }
}

