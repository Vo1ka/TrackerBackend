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
import { FriendsModule } from './friends/friends.module';
import { FriendsController } from './friends/friends.controller';
import { FriendsService } from './friends/friends.service';
import { FeedService } from './feed/feed.service';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { EventsService } from './events/events.service';
import { EventsController } from './events/events.controller';
import { InsightsModule } from './insights/insights.module';
import { AiModule } from './ai/ai.module';
import { WorkspaceModule } from './workspace/workspace.module';


@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PrismaModule,
    AchievementsModule, 
    FeedModule,
    FriendsModule,
    UsersModule,
    EventsModule,
    InsightsModule,
    AiModule,
    WorkspaceModule
  ],
  controllers: [
    ProfileController, 
    GoalsController,
    StepsController,
    SubtasksController,
    FeedController,
    FriendsController,
    EventsController
  ],
  providers: [
    PrismaService, 
    ContentModerationService, 
    AchievementsService,
    FeedService,
    FriendsService,
    EventsService
  ]
})
export class AppModule {}