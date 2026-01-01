// src/goals/steps.controller.ts

import {
  Controller, Post, Delete, Param, Body, UseGuards, Req, 
  NotFoundException, ForbiddenException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ContentModerationService } from '../common/content-moderation.service';
import { AchievementsService } from '../achievements/achievements.service';
import { EventsService } from '../events/events.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;  // ✅ ПРАВИЛЬНО
    email: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('goals/:goalId/steps')
export class StepsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: ContentModerationService,
    private readonly achievementsService: AchievementsService,
    private readonly eventsService: EventsService
  ) {}

  @Post()
  async addStep(
    @Req() req: AuthenticatedRequest,
    @Param('goalId') goalId: string,
    @Body() body: { value?: number; note?: string }
  ) {
    console.log('➕ Adding step to goal:', goalId, 'for user:', req.user.userId);

    // Модерация
    if (body.note && !(await this.moderation.checkText(body.note))) {
      throw new ForbiddenException('Недопустимый текст в комментарии');
    }

    // Получаем цель
    const goal = await this.prisma.goal.findUnique({
      where: { id: Number(goalId) },
    });

    if (!goal) {
      throw new NotFoundException('Цель не найдена');
    }

    if (goal.userId !== req.user.userId) {
      throw new ForbiddenException('Нет доступа к этой цели');
    }

    // Создаём шаг
    const step = await this.prisma.step.create({
      data: {
        goalId: Number(goalId),
        value: body.value,
        note: body.note,
      },
    });

    console.log('✅ Step created:', step.id);

    // Проверяем достижения
    await this.achievementsService.checkAndGrantAll(req.user.userId);

    // Событие
    await this.eventsService.add(req.user.userId, {
      eventType: 'create_step',
      goalId: Number(goalId),
      stepId: step.id,
      sphere: goal.sphere || undefined,
      payload: { value: body.value, note: body.note },
      source: 'web',
    });

    return step;
  }

  @Delete(':stepId')
  async deleteStep(
    @Req() req: AuthenticatedRequest,
    @Param('goalId') goalId: string,
    @Param('stepId') stepId: string,
  ) {
    console.log('🗑️ Deleting step:', stepId, 'from goal:', goalId);

    const step = await this.prisma.step.findUnique({ 
      where: { id: Number(stepId) } 
    });

    if (!step) {
      throw new NotFoundException('Шаг не найден');
    }

    const goal = await this.prisma.goal.findUnique({ 
      where: { id: step.goalId } 
    });

    if (!goal || goal.userId !== req.user.userId) {
      throw new ForbiddenException('Нет доступа');
    }

    await this.prisma.step.delete({ 
      where: { id: Number(stepId) } 
    });

    // Событие
    await this.eventsService.add(req.user.userId, {
      eventType: 'delete_step',
      stepId: Number(stepId),
      goalId: goal.id,
      sphere: goal.sphere || undefined,
      payload: { 
        value: step.value,
        note: step.note,
      },
      source: 'web',
    });

    console.log('✅ Step deleted:', stepId);
    return { message: 'Шаг удалён' };
  }
}
