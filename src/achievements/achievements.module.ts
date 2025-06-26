import { Module } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { PrismaService } from '../prisma/prisma.service';
import { FeedModule } from 'src/feed/feed.module';

@Module({
  imports: [FeedModule], // ← добавь импорт
  providers: [AchievementsService, PrismaService],
  controllers: [AchievementsController],
})
export class AchievementsModule {}