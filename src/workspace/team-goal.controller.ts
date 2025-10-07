// src/workspace/team-goals.controller.ts

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

import { CreateTeamGoalDto } from './dto/create-team-goal.dto';
import { AddStepDto } from './dto/add-step.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TeamGoalsService } from './team-goal.service';

@Controller('workspaces/:workspaceId/goals')
@UseGuards(JwtAuthGuard)
export class TeamGoalsController {
  constructor(private teamGoalsService: TeamGoalsService) {}

  // ✅ Список командных целей (БЕЗ :goalId в роуте)
  @Get()
  async list(
    @Req() req,
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('ownerId') ownerId?: string, // ← Query параметр, не ParseIntPipe здесь
  ) {
    return this.teamGoalsService.findAll(workspaceId, req.user.id, {
      status,
      category,
      ownerId: ownerId ? parseInt(ownerId) : undefined,
    });
  }

  // ✅ Создать командную цель
  @Post()
  async create(
    @Req() req,
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Body() dto: CreateTeamGoalDto,
  ) {
    return this.teamGoalsService.create(workspaceId, req.user.id, dto);
  }

  // ✅ Детали командной цели (С :goalId в роуте)
  @Get(':goalId')
  async getDetails(
    @Req() req,
    @Param('workspaceId', ParseIntPipe) workspaceId: number, // ← Добавь workspaceId
    @Param('goalId', ParseIntPipe) goalId: number,
  ) {
    return this.teamGoalsService.findOne(goalId, req.user.id);
  }

  // ✅ Добавить шаг к командной цели
  @Post(':goalId/steps')
  async addStep(
    @Req() req,
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('goalId', ParseIntPipe) goalId: number,
    @Body() dto: AddStepDto,
  ) {
    return this.teamGoalsService.addStep(goalId, req.user.id, dto);
  }

  // ✅ Обновить командную цель
  @Patch(':goalId')
  async update(
    @Req() req,
    @Param('goalId', ParseIntPipe) goalId: number,
    @Body() dto: Partial<CreateTeamGoalDto>,
  ) {
    return this.teamGoalsService.update(goalId, req.user.id, dto);
  }

  // ✅ Удалить командную цель
  @Delete(':goalId')
  async delete(
    @Req() req,
    @Param('goalId', ParseIntPipe) goalId: number,
  ) {
    return this.teamGoalsService.delete(goalId, req.user.id);
  }
}
