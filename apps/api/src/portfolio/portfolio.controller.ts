import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import type { JwtAuthUser } from '../auth/jwt/jwt.strategy';
import { PortfolioService } from './portfolio.service';

@Controller('/api/v1/portfolio')
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get('/overview')
  @UseGuards(JwtAuthGuard)
  overview(@Req() req: Request) {
    const user = req.user as JwtAuthUser;
    return this.portfolio.getOverview(user.userId);
  }

  @Get('/positions')
  @UseGuards(JwtAuthGuard)
  positions(@Req() req: Request) {
    const user = req.user as JwtAuthUser;
    return this.portfolio.getPositions(user.userId);
  }

  @Get('/transactions')
  @UseGuards(JwtAuthGuard)
  transactions(
    @Req() req: Request,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const user = req.user as JwtAuthUser;
    return this.portfolio.getTransactions(user.userId, from, to);
  }

  @Post('/sync')
  @UseGuards(JwtAuthGuard)
  sync(@Req() req: Request) {
    const user = req.user as JwtAuthUser;
    return this.portfolio.syncNow(user.userId);
  }
}
