import { Controller, Post, Get, Param, Body, Req, UseGuards, Query, Patch, Delete, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupsService } from './groups.service';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

interface AuthenticatedRequest extends Request {
  user: { userId: number; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly prisma: PrismaService,
) {}

  @Post()
  async createGroup(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.groupsService.createGroup(req.user.userId, body.title, body.description);
  }

  @Post(':groupId/join')
  async joinGroup(@Req() req: AuthenticatedRequest, @Param('groupId') groupId: string) {
    return this.groupsService.joinGroup(req.user.userId, Number(groupId));
  }

  @Get()
  async getMyGroups(@Req() req: AuthenticatedRequest) {
    return this.groupsService.getMyGroups(req.user.userId);
  }
  @Patch(':groupId/members/:memberId/role')
    async changeMemberRole(
      @Req() req: AuthenticatedRequest,
      @Param('groupId') groupId: string,
      @Param('memberId') memberId: string,
      @Body() body: { role: string }
    ) {
      // Проверить, что вызывающий — владелец или админ группы
      const actor = await this.prisma.groupMember.findFirst({
        where: {
          groupId: Number(groupId),
          userId: req.user.userId
        }
      });
      if (!actor || !(actor.role === 'owner' || actor.role === 'admin')) {
        throw new ForbiddenException('Недостаточно прав');
      }

      // Нельзя менять роль owner или себя самого (опционально)
      const member = await this.prisma.groupMember.findUnique({
        where: { id: Number(memberId) }
      });
      if (!member) throw new NotFoundException('Участник не найден');
      if (member.role === 'owner') throw new ForbiddenException('Нельзя менять роль владельца');

      return this.prisma.groupMember.update({
        where: { id: Number(memberId) },
        data: { role: body.role }
      });
    }

  @Get(':groupId/members')
  async getGroupMembers(@Param('groupId') groupId: string) {
    return this.groupsService.getGroupMembers(Number(groupId));
  }
  @Get('search')
    async searchGroups(@Query('query') query: string) {
        return this.groupsService.searchGroups(query);
    }
  @Post(':groupId/goals')
        async createGroupGoal(
        @Req() req: AuthenticatedRequest,
        @Param('groupId') groupId: string,
        @Body() body: any
        ) {
        // (Опционально: проверить, что пользователь — участник этой группы)
        // Можно добавить проверки роли — owner/admin может создавать цели
        return this.prisma.groupGoal.create({
            data: {
            groupId: Number(groupId),
            title: body.title,
            description: body.description
            }
        });
    }

    @Get(':groupId/goals')
    async getGroupGoals(@Param('groupId') groupId: string) {
    return this.prisma.groupGoal.findMany({
        where: { groupId: Number(groupId) }
    });
    }
    @Patch(':groupId/goals/:goalId')
        async updateGroupGoal(
        @Req() req: AuthenticatedRequest,
        @Param('groupId') groupId: string,
        @Param('goalId') goalId: string,
        @Body() body: any
        ) {
        // (Опционально: проверить, что пользователь — админ или owner группы)
        return this.prisma.groupGoal.update({
            where: { id: Number(goalId) },
            data: {
            title: body.title,
            description: body.description
            }
        });
    }
    @Delete(':groupId/goals/:goalId')
      async deleteGroupGoal(
        @Req() req: AuthenticatedRequest,
        @Param('groupId') groupId: string,
        @Param('goalId') goalId: string
        ) {
        // (Опционально: проверить права)
        await this.prisma.groupGoal.delete({ where: { id: Number(goalId) } });
        return { message: 'Групповая цель удалена' };
      }
      @Get(':groupId')
        async getGroup(@Param('groupId') groupId: string) {
          const group = await this.prisma.group.findUnique({
            where: { id: Number(groupId) },
            include: {
              members: {
                include: {
                  user: { select: { id: true, name: true, avatarUrl: true } }
                }
              },
              goals: true
            }
          });
          if (!group) throw new NotFoundException('Группа не найдена');
          return group;
        }

      //кик из группы
      @Delete(':groupId/members/:memberId')
        async kickMember(
          @Req() req: AuthenticatedRequest,
          @Param('groupId') groupId: string,
          @Param('memberId') memberId: string
        ) {
          // Проверить, что вызывающий — владелец или админ группы
          const actor = await this.prisma.groupMember.findFirst({
            where: {
              groupId: Number(groupId),
              userId: req.user.userId
            }
          });
          if (!actor || !(actor.role === 'owner' || actor.role === 'admin')) {
            throw new ForbiddenException('Недостаточно прав');
          }

          // Нельзя кикать owner-а (и, возможно, себя самого)
          const member = await this.prisma.groupMember.findUnique({
            where: { id: Number(memberId) }
          });
          if (!member) throw new NotFoundException('Участник не найден');
          if (member.role === 'owner') throw new ForbiddenException('Нельзя кикать владельца группы');

          await this.prisma.groupMember.delete({
            where: { id: Number(memberId) }
          });
          return { message: 'Участник удалён из группы' };
      }
    // Обновить свой прогресс по групповой цели
    @Patch(':groupId/goals/:goalId/progress')
    async updateMyProgress(
      @Req() req: AuthenticatedRequest,
      @Param('goalId') goalId: string,
      @Body() body: { progress: number, completed: boolean }
    ) {
      return this.groupsService.updateProgress(
        req.user.userId,
        Number(goalId),
        body.progress,
        body.completed
      );
    }
    // Получить лидерборд по цели
    @Get(':groupId/goals/:goalId/leaderboard')
    async getLeaderboard(@Param('goalId') goalId: string) {
      return this.groupsService.getLeaderboard(Number(goalId));
    }
    // Получить сообщения чата группы
  @Get(':groupId/chat')
  async getGroupChat(
    @Param('groupId') groupId: string,
    @Query('limit') limit = '50',
    @Query('offset') offset = '0'
  ) {
    return this.prisma.groupMessage.findMany({
        where: { groupId: Number(groupId) },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } }
        }
    });

  }

  // Отправить сообщение в чат группы
  @Post(':groupId/chat')
  async postGroupMessage(
    @Req() req: AuthenticatedRequest,
    @Param('groupId') groupId: string,
    @Body() body: { text: string }
  ) {
    // (опционально: проверить, является ли юзер участником группы)
    return this.prisma.groupMessage.create({
      data: {
        groupId: Number(groupId),
        userId: req.user.userId,
        text: body.text
      }
    });
  }
  @Delete(':groupId/leave')
    async leaveGroup(
      @Req() req: AuthenticatedRequest,
      @Param('groupId') groupId: string
    ) {
      // Ищем membership текущего пользователя в этой группе
      const membership = await this.prisma.groupMember.findFirst({
        where: {
          groupId: Number(groupId),
          userId: req.user.userId
        }
      });
      if (!membership) throw new NotFoundException('Вы не состоите в этой группе');

      // (Опционально: запретить owner-у выйти, пока не передаст права)
      if (membership.role === 'owner') {
        throw new ForbiddenException('Владелец не может выйти из группы, пока не передаст права другому участнику');
      }

      await this.prisma.groupMember.delete({
        where: { id: membership.id }
      });

      return { message: 'Вы успешно покинули группу' };
  }

}
