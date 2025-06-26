import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileController } from './profile/profile.controller';
import { ContentModerationService } from './common/content-moderation.service';
import { PrismaService } from './prisma/prisma.service';
import { GoalsController } from './goals/goals.controller';
import { SubtasksController } from './goals/goals.subtasks';
import { StepsController } from './goals/steps.controller';
import { AchievementsModule } from './achievements/achievements.module';
import { AchievementsService } from './achievements/achievements.service';
import { FeedModule } from './feed/feed.module';
import { FeedController } from './feed/feed.controller';


@Module({
  imports: [
    AuthModule,
    PrismaModule,
    AchievementsModule, 
    FeedModule
  ],
  controllers: [
    ProfileController, 
    GoalsController,
    StepsController,
    SubtasksController,
    FeedController
  ],
  providers: [
    PrismaService, 
    ContentModerationService, 
    AchievementsService,
    FeedController
  ]
})
export class AppModule {}