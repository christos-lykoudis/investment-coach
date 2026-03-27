import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";
import { PrismaPg } from "@prisma/adapter-pg";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({ connectionString: env.databaseUrl } as any);
    super({ adapter });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

