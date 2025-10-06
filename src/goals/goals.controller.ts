import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req,
  NotFoundException, ForbiddenException,
  Query
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ContentModerationService } from '../common/content-moderation.service';
import { Request } from 'express';
import { AchievementsService } from 'src/achievements/achievements.service';
import { FeedService } from 'src/feed/feed.service';
import { EventsService } from 'src/events/events.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
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
    private  readonly eventsService: EventsService
  ) {}

  @Post()
  async createGoal(@Req() req: AuthenticatedRequest, @Body() body: any) {
    // Модерация title и description
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
        privacy: body.privacy, // public/private/friends-only
        progressType: body.progressType, // quantity/days/subtasks/duration
        targetValue: body.targetValue,
        sphere: body.sphere               
      },
    });

    // Добавляем событие в feed
    await this.feedService.addEvent(
      req.user.userId,
      'goal_created',
      { goalId: goal.id, title: goal.title }
    );

    await this.achievementsService.checkAndGrantAll(req.user.userId);
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
      const where: any = { userId: req.user.userId };
      if (sphere) where.sphere = sphere;

      return this.prisma.goal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { steps: true, subtasks: true },
      });
    }

  @Get(':id')
  async getGoal(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const goal = await this.prisma.goal.findUnique({ 
      where: { id: Number(id) },
      include: { steps: true, subtasks: true }
     });
    if (!goal) throw new NotFoundException('Цель не найдена');
    if (goal.userId !== req.user.userId) throw new ForbiddenException('Нет доступа');
    return goal;
  }

  @Patch(':id')
  async updateGoal(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: any) {
    const goal = await this.prisma.goal.findUnique({ where: { id: Number(id) } });
    if (!goal) throw new NotFoundException('Цель не найдена');
    if (goal.userId !== req.user.userId) throw new ForbiddenException('Нет доступа');

    // Модерация обновлений
    if (body.title && !(await this.moderation.checkText(body.title))) {
      throw new ForbiddenException('Недопустимый текст в названии цели');
    }
    if (body.description && !(await this.moderation.checkText(body.description))) {
      throw new ForbiddenException('Недопустимый текст в описании цели');
    }
    await this.eventsService.add(req.user.userId, {
      eventType: 'update_goal',
      goalId: goal.id,
      payload: { changed: Object.keys(body) },
      source: 'web',
    });

    return this.prisma.goal.update({
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
  }

  @Delete(':id')
    async deleteGoal(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
      const goal = await this.prisma.goal.findUnique({ where: { id: Number(id) } });
      if (!goal) throw new NotFoundException('Цель не найдена');
      if (goal.userId !== req.user.userId) throw new ForbiddenException('Нет доступа');

      // Сначала удалить все связанные шаги и подцели!
      await this.prisma.step.deleteMany({ where: { goalId: goal.id } });
      await this.prisma.subtask.deleteMany({ where: { goalId: goal.id } });
      // (Если есть ещё feed, achievements — аналогично)
      await this.eventsService.add(req.user.userId, {
        eventType: 'delete_goal',
        goalId: goal.id,
        source: 'web',
      });

      await this.prisma.goal.delete({ where: { id: Number(id) } });
      return { message: 'Цель удалена' };
    }
}
