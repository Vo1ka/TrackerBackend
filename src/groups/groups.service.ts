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

  // CRUD для групповых целей — реализуй по аналогии с обычными целями!
}
