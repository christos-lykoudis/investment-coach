import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import type { JwtAuthUser } from "../auth/jwt/jwt.strategy";
import { BrokerService } from "./broker.service";
import { CreateConnectSessionDto } from "./dto/create-connect-session.dto";
import { FinalizeConnectCallbackDto } from "./dto/finalize-connect-callback.dto";

@Controller("/api/v1/broker")
export class BrokerController {
  constructor(private readonly broker: BrokerService) {}

  @Post("/connect/session")
  @UseGuards(JwtAuthGuard)
  createSession(@Req() req: Request, @Body() dto: CreateConnectSessionDto) {
    const user = req.user as JwtAuthUser;
    return this.broker.createConnectSession(user.userId, dto.provider);
  }

  @Get("/connect/providers")
  @UseGuards(JwtAuthGuard)
  listProviders() {
    return this.broker.listSupportedProviders();
  }

  @Post("/connect/callback")
  @UseGuards(JwtAuthGuard)
  finalizeConnect(@Req() req: Request, @Body() dto: FinalizeConnectCallbackDto) {
    const user = req.user as JwtAuthUser;
    return this.broker.finalizeConnect(user.userId, dto.sessionId, dto.providerToken);
  }

  @Get("/connections")
  @UseGuards(JwtAuthGuard)
  listConnections(@Req() req: Request) {
    const user = req.user as JwtAuthUser;
    return this.broker.listConnections(user.userId);
  }

  @Delete("/connections/:id")
  @UseGuards(JwtAuthGuard)
  disconnect(@Req() req: Request, @Param("id") id: string) {
    const user = req.user as JwtAuthUser;
    return this.broker.disconnect(user.userId, id);
  }

  @Get("/connections/:id/sync-runs")
  @UseGuards(JwtAuthGuard)
  listSyncRuns(@Req() req: Request, @Param("id") id: string) {
    const user = req.user as JwtAuthUser;
    return this.broker.listSyncRuns(user.userId, id);
  }
}

