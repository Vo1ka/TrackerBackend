// src/achievements/achievements.controller.ts

import { Controller, Get, UseGuards, Req, Param, Query } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementsController {
  constructor(private achievementsService: AchievementsService) {}

  // Получить достижения текущего пользователя (только unlocked)
  @Get()
  async getUserAchievements(@Req() req) {
    console.log('🏆 GET /achievements - userId:', req.user.id);
    const achievements = await this.achievementsService.getUserAchievements(req.user.id);
    console.log('📊 Found achievements:', achievements.length);
    return achievements;
  }

  // Получить ВСЕ достижения (unlocked + locked)
  @Get('all')
  async getAllAchievements(@Req() req) {
    console.log('🏆 GET /achievements/all - userId:', req.user.id);
    const result = await this.achievementsService.getAllAchievements(req.user.id);
    console.log('📊 Unlocked:', result.unlocked.length, 'Locked:', result.locked.length);
    return result;
  }

  // Достижения другого пользователя
  @Get('user/:userId')
  async getAchievementsByUserId(@Req() req, @Param('userId') userId: string) {
    console.log('🏆 GET /achievements/user/:userId - targetUserId:', userId);
    return this.achievementsService.getUserAchievements(+userId);
  }
  // Статистика
  @Get('stats')
  async getStats(@Req() req) {
    return this.achievementsService.getUserAchievementStats(req.user.id);
  }

  // Последние достижения
  @Get('recent')
  async getRecent(@Req() req, @Query('limit') limit?: string) {
    return this.achievementsService.getRecentAchievements(
      req.user.id,
      limit ? parseInt(limit) : 5,
    );
  }

  // Прогресс конкретного достижения
  @Get(':achievementId/progress')
  async getProgress(
    @Req() req,
    @Param('achievementId') achievementId: string,
  ) {
    const progress = await this.achievementsService.getAchievementProgress(
      req.user.id,
      +achievementId,
    );
    return { progress };
  }

}
