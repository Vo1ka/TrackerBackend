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
@Controller('goals/:goalId/steps')
export class StepsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: ContentModerationService,
    private readonly achievementsService: AchievementsService
  ) {}

  @Post()
  async addStep(
  @Req() req: AuthenticatedRequest,
  @Param('goalId') goalId: string,
  @Body() body: any,
) {
  // ...проверки...

  const step = await this.prisma.step.create({
    data: {
      goalId: Number(goalId),
      value: body.value,
      note: body.note,
    },
  });

  // После добавления шага — проверить ачивки
  await this.achievementsService.checkAndGrantAll(req.user.userId);

  return step;
}


  @Delete(':stepId')
  async deleteStep(
    @Req() req: AuthenticatedRequest,
    @Param('goalId') goalId: string,
    @Param('stepId') stepId: string,
  ) {
    const step = await this.prisma.step.findUnique({ where: { id: Number(stepId) } });
    if (!step) throw new NotFoundException('Шаг не найден');
    const goal = await this.prisma.goal.findUnique({ where: { id: step.goalId } });
    if (!goal || goal.userId !== req.user.userId) throw new ForbiddenException('Нет доступа');
    await this.prisma.step.delete({ where: { id: Number(stepId) } });
    return { message: 'Шаг удалён' };
  }
}
