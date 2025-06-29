import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  // Создать группу
  async createGroup(userId: number, title: string, description?: string) {
    const group = await this.prisma.group.create({
      data: {
        title,
        description,
        members: {
          create: [{ userId, role: 'owner' }]
        }
      },
      include: { members: true }
    });
    return group;
  }
  //Поиск групп
  async searchGroups(query: string) {
    if (!query || query.length < 2) return [];
    return this.prisma.group.findMany({
        where: {
        OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
        ]
        },
        select: { id: true, title: true, description: true, createdAt: true }
    });
    }

  // Присоединиться к группе
  async joinGroup(userId: number, groupId: number) {
    // Проверяем, не член ли уже
    const exists = await this.prisma.groupMember.findFirst({
      where: { userId, groupId }
    });
    if (exists) return exists;
    return this.prisma.groupMember.create({
      data: { userId, groupId, role: 'member' }
    });
  }

  // Получить свои группы
  async getMyGroups(userId: number) {
    return this.prisma.groupMember.findMany({
      where: { userId },
      include: { group: true }
    });
  }

  // Получить список участников группы
  async getGroupMembers(groupId: number) {
    return this.prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } }
    });
  }
  // Создать групповую цель
  async createGroupGoal(groupId: number, title: string, description?: string) {
    return this.prisma.groupGoal.create({
      data: { groupId, title, description }
    });
  }

  // Получить все цели группы с прогрессом участников
  async getGroupGoalsWithProgress(groupId: number) {
    return this.prisma.groupGoal.findMany({
      where: { groupId },
      include: {
        progresses: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } }
          }
        }
      }
    });
  }

  // Обновить персональный прогресс пользователя по групповой цели
  async updateProgress(userId: number, groupGoalId: number, progress: number, completed: boolean) {
    // Проверить, есть ли уже запись
    const existing = await this.prisma.groupGoalProgress.findFirst({
      where: { userId, groupGoalId }
    });
    if (existing) {
      return this.prisma.groupGoalProgress.update({
        where: { id: existing.id },
        data: { progress, completed }
      });
    } else {
      return this.prisma.groupGoalProgress.create({
        data: { userId, groupGoalId, progress, completed }
      });
    }
  }

  // Лидерборд по прогрессу в цель
  async getLeaderboard(groupGoalId: number) {
    return this.prisma.groupGoalProgress.findMany({
      where: { groupGoalId },
      orderBy: [{ progress: 'desc' }, { updatedAt: 'asc' }],
      include: { user: { select: { id: true, name: true, avatarUrl: true } } }
    });
  }

  // CRUD для групповых целей — реализуй по аналогии с обычными целями!
}
