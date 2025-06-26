import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AchievementsService } from './achievements.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  // Получить ачивки пользователя
  @Get()
  async getMyAchievements(@Req() req: AuthenticatedRequest) {
    return this.achievementsService.getUserAchievements(req.user.userId);
  }

  // Получить справочник всех ачивок
  @Get('/all')
  async getAllAchievements() {
    return this.achievementsService.getAllAchievements();
  }
}
