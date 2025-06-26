import {
  Controller, Post, Patch, Delete, Param, Body, UseGuards, Req, NotFoundException, ForbiddenException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ContentModerationService } from '../common/content-moderation.service';
import { Request } from 'express';
import { AchievementsService } from 'src/achievements/achievements.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('goals/:goalId/subtasks')
export class SubtasksController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: ContentModerationService,
    private readonly achievementsService: AchievementsService
  ) {}

  @Post()
    async addSubtask(
    @Req() req: AuthenticatedRequest,
    @Param('goalId') goalId: string,
    @Body() body: any,
  ) {
    // ...проверки...

    const subtask = await this.prisma.subtask.create({
      data: {
        goalId: Number(goalId),
        title: body.title,
        completed: !!body.completed,
      },
    });

    // После добавления подцели — проверить ачивки
    await this.achievementsService.checkAndGrantAll(req.user.userId);

    return subtask;
  }

  @Patch(':subtaskId')
  async updateSubtask(
    @Req() req: AuthenticatedRequest,
    @Param('goalId') goalId: string,
    @Param('subtaskId') subtaskId: string,
    @Body() body: any,
  ) {
    // ...проверки...

    const updated = await this.prisma.subtask.update({
      where: { id: Number(subtaskId) },
      data: {
        title: body.title,
        completed: body.completed,
      },
    });

    // После обновления подцели — проверить ачивки
    await this.achievementsService.checkAndGrantAll(req.user.userId);

    return updated;
  }

  @Delete(':subtaskId')
  async deleteSubtask(
    @Req() req: AuthenticatedRequest,
    @Param('goalId') goalId: string,
    @Param('subtaskId') subtaskId: string,
  ) {
    // ...проверки...

    await this.prisma.subtask.delete({ where: { id: Number(subtaskId) } });

    // После удаления подцели — проверить ачивки (если нужны такие)
    await this.achievementsService.checkAndGrantAll(req.user.userId);

    return { message: 'Подцель удалена' };
  }
}
