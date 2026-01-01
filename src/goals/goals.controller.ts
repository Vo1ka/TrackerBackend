// src/goals/goals.controller.ts

import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req,
  NotFoundException, ForbiddenException, Query
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ContentModerationService } from '../common/content-moderation.service';
import { AchievementsService } from '../achievements/achievements.service';
import { FeedService } from '../feed/feed.service';
import { EventsService } from '../events/events.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;  // ✅ ПРАВИЛЬНО
    email: string;
  };
}

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: ContentModerationService,
    private readonly achievementsService: AchievementsService,
    private readonly feedService: FeedService,
    private readonly eventsService: EventsService
  ) {}

  @Post()
  async createGoal(@Req() req: AuthenticatedRequest, @Body() body: any) {
    console.log('🎯 Creating goal for user:', req.user.userId);

    // Модерация
    if (body.title && !(await this.moderation.checkText(body.title))) {
      throw new ForbiddenException('Недопустимый текст в названии цели');
    }
    if (body.description && !(await this.moderation.checkText(body.description))) {
      throw new ForbiddenException('Недопустимый текст в описании цели');
    }

    const goal = await this.prisma.goal.create({
      data: {
        userId: req.user.userId,
        title: body.title,
        description: body.description,
        privacy: body.privacy,
        progressType: body.progressType,
        targetValue: body.targetValue,
        sphere: body.sphere,
      },
    });

    console.log('✅ Goal created:', goal.id);

    // Feed event
    await this.feedService.addEvent(
      req.user.userId,
      'goal_created',
      { goalId: goal.id, title: goal.title }
    );

    // Проверка достижений
    await this.achievementsService.checkAndGrantAll(req.user.userId);

    // Событие
    await this.eventsService.add(req.user.userId, {
      eventType: 'create_goal',
      goalId: goal.id,
      sphere: goal.sphere || undefined,
      payload: { title: goal.title, sphere: goal.sphere },
      source: 'web',
    });

    return goal;
  }

  @Get()
  async getGoals(
    @Req() req: AuthenticatedRequest,
    @Query('sphere') sphere?: string
  ) {
    console.log('📋 Getting goals for user:', req.user.userId, 'sphere:', sphere);

    const where: any = { userId: req.user.userId };
    if (sphere) where.sphere = sphere;

    const goals = await this.prisma.goal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { 
        steps: {
          orderBy: { createdAt: 'desc' }
        }, 
        subtasks: true 
      },
    });

    console.log('✅ Found goals:', goals.length);
    return goals;
  }

  @Get(':id')
  async getGoal(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    console.log('🔍 Getting goal:', id, 'for user:', req.user.userId);

    const goal = await this.prisma.goal.findUnique({ 
      where: { id: Number(id) },
      include: { 
        steps: {
          orderBy: { createdAt: 'desc' }
        }, 
        subtasks: true 
      }
    });

    if (!goal) {
      throw new NotFoundException('Цель не найдена');
    }

    if (goal.userId !== req.user.userId) {
      throw new ForbiddenException('Нет доступа');
    }

    return goal;
  }

  @Patch(':id')
  async updateGoal(
    @Req() req: AuthenticatedRequest, 
    @Param('id') id: string, 
    @Body() body: any
  ) {
    console.log('✏️ Updating goal:', id, 'for user:', req.user.userId);

    const goal = await this.prisma.goal.findUnique({ 
      where: { id: Number(id) } 
    });

    if (!goal) {
      throw new NotFoundException('Цель не найдена');
    }

    if (goal.userId !== req.user.userId) {
      throw new ForbiddenException('Нет доступа');
    }

    // Модерация
    if (body.title && !(await this.moderation.checkText(body.title))) {
      throw new ForbiddenException('Недопустимый текст в названии цели');
    }
    if (body.description && !(await this.moderation.checkText(body.description))) {
      throw new ForbiddenException('Недопустимый текст в описании цели');
    }

    // Событие
    await this.eventsService.add(req.user.userId, {
      eventType: 'update_goal',
      goalId: goal.id,
      payload: { changed: Object.keys(body) },
      source: 'web',
    });

    const updated = await this.prisma.goal.update({
      where: { id: Number(id) },
      data: {
        title: body.title,
        description: body.description,
        privacy: body.privacy,
        progressType: body.progressType,
        targetValue: body.targetValue,
        completedAt: body.completedAt,
      },
    });

    console.log('✅ Goal updated:', updated.id);
    return updated;
  }

  @Delete(':id')
  async deleteGoal(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    console.log('🗑️ Deleting goal:', id, 'for user:', req.user.userId);

    const goal = await this.prisma.goal.findUnique({ 
      where: { id: Number(id) } 
    });

    if (!goal) {
      throw new NotFoundException('Цель не найдена');
    }

    if (goal.userId !== req.user.userId) {
      throw new ForbiddenException('Нет доступа');
    }

    // Удаляем связанные данные
    await this.prisma.step.deleteMany({ where: { goalId: goal.id } });
    await this.prisma.subtask.deleteMany({ where: { goalId: goal.id } });

    // Событие
    await this.eventsService.add(req.user.userId, {
      eventType: 'delete_goal',
      goalId: goal.id,
      source: 'web',
    });

    await this.prisma.goal.delete({ where: { id: Number(id) } });

    console.log('✅ Goal deleted:', id);
    return { message: 'Цель удалена' };
  }
}
