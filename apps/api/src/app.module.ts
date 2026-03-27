import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { MeModule } from "./me/me.module";
import { BrokerModule } from "./broker/broker.module";
import { PortfolioModule } from "./portfolio/portfolio.module";
import { RiskModule } from "./risk/risk.module";
import { CoachModule } from "./coach/coach.module";
import { InternalModule } from "./internal/internal.module";
import { MetricsModule } from "./metrics/metrics.module";
import { RequestLoggerMiddleware } from "./common/logging/request-logger.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    MeModule,
    BrokerModule,
    PortfolioModule,
    RiskModule,
    CoachModule,
    InternalModule,
    MetricsModule
  ],
  providers: [RequestLoggerMiddleware]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes("*");
  }
}

