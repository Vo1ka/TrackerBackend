import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateWorkspaceDto) {
    // Проверяем уникальность slug
    const existing = await this.prisma.workspace.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Workspace with this slug already exists');
    }

    // Создаём workspace с создателем как owner
    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            teamGoals: true,
          },
        },
      },
    });

    return workspace;
  }

  async findAllByUser(userId: number) {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
        _count: {
          select: {
            members: true,
            teamGoals: true,
          },
        },
      },
    });

    // Форматируем ответ
    return workspaces.map((ws) => ({
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      description: ws.description,
      plan: ws.plan,
      role: ws.members[0]?.role,
      memberCount: ws._count.members,
      goalCount: ws._count.teamGoals,
      createdAt: ws.createdAt,
    }));
  }

  async findOne(workspaceId: number, userId: number) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            teamGoals: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found or access denied');
    }

    return workspace;
  }

  async update(workspaceId: number, userId: number, dto: UpdateWorkspaceDto) {
    // Проверяем права (только admin/owner)
    await this.checkRole(workspaceId, userId, ['admin', 'owner']);

    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: dto,
    });
  }

  async delete(workspaceId: number, userId: number) {
    // Проверяем права (только owner)
    await this.checkRole(workspaceId, userId, ['owner']);

    return this.prisma.workspace.delete({
      where: { id: workspaceId },
    });
  }

  // Вспомогательные методы

  async getUserRole(workspaceId: number, userId: number): Promise<string | null> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      select: { role: true },
    });

    return member?.role || null;
  }

  async checkRole(workspaceId: number, userId: number, allowedRoles: string[]) {
    const role = await this.getUserRole(workspaceId, userId);

    if (!role || !allowedRoles.includes(role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return role;
  }

  async isMember(workspaceId: number, userId: number): Promise<boolean> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });

    return !!member;
  }
}
