import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';

import { RequireWorkspaceRole } from './decorators/workspace-role.decorator';
import { WorkspaceUser } from './decorators/workspace-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AddStepDto } from './dto/add-step.dto';
import { CreateTeamGoalDto } from './dto/create-team-goal.dto';
import { WorkspaceRoleGuard, WorkspaceRole } from './guards/workspace-role.dto';
import { TeamGoalsService } from './team-goal.service';

@Controller('workspaces/:workspaceId/goals')
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class TeamGoalsController {
  constructor(private teamGoalsService: TeamGoalsService) {}

  // Создать командную цель (только manager+)
  @Post()
  @RequireWorkspaceRole(WorkspaceRole.MANAGER)
  async create(
    @Req() req,
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Body() dto: CreateTeamGoalDto,
  ) {
    return this.teamGoalsService.create(workspaceId, req.user.id, dto);
  }

  // Список командных целей (все члены)
  @Get()
  @RequireWorkspaceRole(WorkspaceRole.MEMBER)
  async list(
    @Req() req,
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('ownerId', ParseIntPipe) ownerId?: number,
  ) {
    return this.teamGoalsService.findAll(workspaceId, req.user.id, {
      status,
      category,
      ownerId,
    });
  }

  // Детали командной цели (все члены)
  @Get(':goalId')
  @RequireWorkspaceRole(WorkspaceRole.MEMBER)
  async getDetails(
    @Req() req,
    @Param('goalId', ParseIntPipe) goalId: number,
  ) {
    return this.teamGoalsService.findOne(goalId, req.user.id);
  }

  // Добавить шаг (все члены)
  @Post(':goalId/steps')
  @RequireWorkspaceRole(WorkspaceRole.MEMBER)
  async addStep(
    @Req() req,
    @Param('goalId', ParseIntPipe) goalId: number,
    @Body() dto: AddStepDto,
    @WorkspaceUser('role') role: string, // Используем декоратор
  ) {
    console.log('User role in workspace:', role);
    return this.teamGoalsService.addStep(goalId, req.user.id, dto);
  }

  // Обновить командную цель (owner цели или admin+)
  @Patch(':goalId')
  async update(
    @Req() req,
    @Param('goalId', ParseIntPipe) goalId: number,
    @Body() dto: Partial<CreateTeamGoalDto>,
  ) {
    return this.teamGoalsService.update(goalId, req.user.id, dto);
  }

  // Удалить командную цель (owner цели или admin+)
  @Delete(':goalId')
  async delete(
    @Req() req,
    @Param('goalId', ParseIntPipe) goalId: number,
  ) {
    return this.teamGoalsService.delete(goalId, req.user.id);
  }
}
