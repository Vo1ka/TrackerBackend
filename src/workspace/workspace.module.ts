import { Module } from '@nestjs/common';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import { MembersController } from './members.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { WorkspaceRoleGuard } from './guards/workspace-role.dto';
import { MembersService } from './members.service';
import { TeamGoalsController } from './team-goal.controller';
import { TeamGoalsService } from './team-goal.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    WorkspaceController,
    MembersController,
    TeamGoalsController,
  ],
  providers: [
    WorkspaceService,
    MembersService,
    TeamGoalsService,
    WorkspaceRoleGuard,
  ],
  exports: [WorkspaceService, MembersService, TeamGoalsService],
})
export class WorkspaceModule {}
