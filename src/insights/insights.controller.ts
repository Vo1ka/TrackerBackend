import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InsightsService } from './insights.service';
import { Request } from 'express';

interface AuthReq extends Request {
  user: { userId: number; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('balance')
  async getBalance(
    @Req() req: AuthReq,
    @Query('window') window?: string,
  ) {
    const windowDays = window === '30' ? 30 : 14; // по умолчанию 14
    return this.insightsService.getBalance(req.user.userId, windowDays);
  }

   @Get('calendar')
  async getCalendar(
    @Req() req: AuthReq,
    @Query('days') days?: string,
  ) {
    const numDays = days ? parseInt(days, 10) : 90; // по умолчанию 90 дней
    return this.insightsService.getCalendar(req.user.userId, numDays);
  }
}
