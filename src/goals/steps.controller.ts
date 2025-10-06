import {
  Controller, Post, Delete, Param, Body, UseGuards, Req, NotFoundException, ForbiddenException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ContentModerationService } from '../common/content-moderation.service';
import { AchievementsService } from '../achievements/achievements.service';
import { EventsService } from '../events/events.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
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
    // Модерация note
    if (body.note && !(await this.moderation.checkText(body.note))) {
      throw new ForbiddenException('Недопустимый текст в комментарии');
    }

    // Получаем цель для проверки доступа и sphere
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

    // Проверяем достижения
    await this.achievementsService.checkAndGrantAll(req.user.userId);

    // Отправляем событие
    await this.eventsService.add(req.user.userId, {
      eventType: 'create_step',
      goalId: Number(goalId),
      stepId: step.id,
      sphere: goal.sphere || undefined, // << берём sphere из цели
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

    // Отправляем событие
    await this.eventsService.add(req.user.userId, {
      eventType: 'delete_step',
      stepId: Number(stepId),
      goalId: goal.id,
      sphere: goal.sphere || undefined, // << добавили sphere
      payload: { 
        value: step.value,
        note: step.note,
      },
      source: 'web',
    });

    return { message: 'Шаг удалён' };
  }
}
