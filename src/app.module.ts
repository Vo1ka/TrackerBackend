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
import { GroupsModule } from './groups/groups.module';
import { GroupsController } from './groups/groups.controller';
import { GroupsService } from './groups/groups.service';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { EventsService } from './events/events.service';
import { EventsController } from './events/events.controller';


@Module({
  imports: [
    AuthModule,
    PrismaModule,
    AchievementsModule, 
    FeedModule,
    FriendsModule,
    GroupsModule,
    UsersModule,
    EventsModule
  ],
  controllers: [
    ProfileController, 
    GoalsController,
    StepsController,
    SubtasksController,
    FeedController,
    FriendsController,
    GroupsController,
    EventsController
  ],
  providers: [
    PrismaService, 
    ContentModerationService, 
    AchievementsService,
    FeedService,
    FriendsService,
    GroupsService,
    EventsService
  ]
})
export class AppModule {}