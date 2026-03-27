import { Module } from "@nestjs/common";
import { PortfolioController } from "./portfolio.controller";
import { PortfolioService } from "./portfolio.service";
import { MarketDataService } from "./market-data.service";

@Module({
  controllers: [PortfolioController],
  providers: [PortfolioService, MarketDataService]
})
export class PortfolioModule {}

