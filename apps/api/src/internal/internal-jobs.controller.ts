import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ServiceTokenGuard } from "./service-token.guard";
import { GenerateBriefJobDto } from "./dto/generate-brief-job.dto";
import { RecomputeRiskJobDto } from "./dto/recompute-risk-job.dto";
import { SyncBrokerJobDto } from "./dto/sync-broker-job.dto";
import { syncBrokerOnce } from "../workers/sync-broker.worker";
import { generateWeeklyBriefOnce } from "../workers/generate-brief.worker";

@Controller("/api/v1/internal/jobs")
@UseGuards(ServiceTokenGuard)
export class InternalJobsController {
  @Post("/sync-broker")
  async syncBroker(@Body() dto: SyncBrokerJobDto) {
    const prisma = new PrismaClient();
    try {
      await syncBrokerOnce(prisma, dto.brokerConnectionId);
      return { queued: false, jobId: null };
    } finally {
      await prisma.$disconnect();
    }
  }

  @Post("/recompute-risk")
  async recomputeRisk(@Body() dto: RecomputeRiskJobDto) {
    // MVP: risk is computed during sync-broker.
    const prisma = new PrismaClient();
    try {
      await syncBrokerOnce(prisma, dto.brokerConnectionId);
      return { queued: false, jobId: null };
    } finally {
      await prisma.$disconnect();
    }
  }

  @Post("/generate-brief")
  async generateBrief(@Body() dto: GenerateBriefJobDto) {
    const prisma = new PrismaClient();
    try {
      const brief = await generateWeeklyBriefOnce(prisma, dto.userId);
      return { queued: false, jobId: brief.id };
    } finally {
      await prisma.$disconnect();
    }
  }
}

