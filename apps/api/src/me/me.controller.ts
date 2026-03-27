import { Body, Controller, Get, Put, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "../auth/auth.service";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import type { JwtAuthUser } from "../auth/jwt/jwt.strategy";
import { UpdatePreferencesDto } from "../auth/dto/preferences.dto";

@Controller("/api/v1/me")
export class MeController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: Request) {
    const user = req.user as JwtAuthUser;
    return this.auth.getMe(user.userId);
  }

  @Put("/preferences")
  @UseGuards(JwtAuthGuard)
  updatePreferences(@Req() req: Request, @Body() dto: UpdatePreferencesDto) {
    const user = req.user as JwtAuthUser;
    return this.auth.updatePreferences(user.userId, dto);
  }
}

