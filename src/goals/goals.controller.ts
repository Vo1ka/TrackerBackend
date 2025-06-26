import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req,
  NotFoundException, ForbiddenException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ContentModerationService } from '../common/content-moderation.service';
import { Request } from 'express';
import { AchievementsService } from 'src/achievements/achievements.service';
import { FeedService } from 'src/feed/feed.service';

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
    private readonly feedService: FeedService
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
      },
    });
    // Добавляем событие в feed
    await this.feedService.addEvent(
      req.user.userId,
      'goal_created',
      { goalId: goal.id, title: goal.title }
    );

    await this.achievementsService.checkAndGrantAll(req.user.userId);
    return goal;
  }

  @Get()
  async getGoals(@Req() req: AuthenticatedRequest) {
    return this.prisma.goal.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  async getGoal(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const goal = await this.prisma.goal.findUnique({ where: { id: Number(id) } });
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
    await this.prisma.goal.delete({ where: { id: Number(id) } });
    return { message: 'Цель удалена' };
  }
}
