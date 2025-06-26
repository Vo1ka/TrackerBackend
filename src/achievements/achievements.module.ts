import { Module } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [AchievementsService, PrismaService],
  controllers: [AchievementsController]
})
export class AchievementsModule {}