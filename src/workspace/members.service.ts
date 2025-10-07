import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceService } from './workspace.service';
import * as crypto from 'crypto';
import { InviteMemberDto } from './dto/invite-member.dto';

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private workspaceService: WorkspaceService,
  ) {}

  // Получить список участников workspace
  async findAll(workspaceId: number, userId: number) {
    // Проверяем что пользователь является членом workspace
    const isMember = await this.workspaceService.isMember(workspaceId, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // owner, admin, manager, member
        { joinedAt: 'asc' },
      ],
    });

    // Получаем статистику по каждому участнику
    const membersWithStats = await Promise.all(
      members.map(async (member) => {
        // Считаем вклад в командные цели
        const contributions = await this.prisma.teamGoalContributor.findMany({
          where: {
            userId: member.userId,
            teamGoal: { workspaceId },
          },
          select: { contribution: true },
        });

        const totalContribution = contributions.reduce(
          (sum, c) => sum + c.contribution,
          0,
        );

        // Считаем количество шагов
        const stepsCount = await this.prisma.teamGoalStep.count({
          where: {
            userId: member.userId,
            teamGoal: { workspaceId },
          },
        });

        return {
          id: member.id,
          userId: member.user.id,
          name: member.user.name,
          email: member.user.email,
          avatarUrl: member.user.avatarUrl,
          bio: member.user.bio,
          role: member.role,
          position: member.position,
          joinedAt: member.joinedAt,
          stats: {
            totalContribution,
            stepsCount,
          },
        };
      }),
    );

    return membersWithStats;
  }

  // Пригласить участника
  async invite(workspaceId: number, userId: number, dto: InviteMemberDto) {
    // Проверяем права (manager, admin, owner могут приглашать)
    await this.workspaceService.checkRole(workspaceId, userId, [
      'manager',
      'admin',
      'owner',
    ]);

    // Проверяем что пользователь с таким email существует
    const invitedUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!invitedUser) {
      throw new NotFoundException('User with this email not found');
    }

    // Проверяем что пользователь ещё не является членом
    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: invitedUser.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this workspace');
    }

    // Проверяем что нет активного приглашения
    const existingInvite = await this.prisma.workspaceInvite.findFirst({
      where: {
        workspaceId,
        email: dto.email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      throw new ConflictException('Active invitation already exists');
    }

    // Генерируем токен
    const token = crypto.randomBytes(32).toString('hex');

    // Создаём приглашение
    const invite = await this.prisma.workspaceInvite.create({
      data: {
        workspaceId,
        email: dto.email,
        role: dto.role,
        token,
        invitedBy: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
      },
      include: {
        workspace: {
          select: {
            name: true,
            slug: true,
          },
        },
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // TODO: Отправить email с приглашением
    // await this.emailService.sendInvitation(invite);

    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      token: invite.token,
      expiresAt: invite.expiresAt,
      workspace: invite.workspace,
      invitedBy: invite.inviter,
    };
  }

  // Принять приглашение
  async acceptInvite(token: string, userId: number) {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: true,
      },
    });

 
    if (!invite) {
      throw new NotFoundException('Invitation not found');
    }

    if (invite.acceptedAt) {
      throw new BadRequestException('Invitation already accepted');
    }

    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Invitation expired');
    }

    // Проверяем что email совпадает с пользователем
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
        throw new NotFoundException('User not found');
    }
    if (user.email !== invite.email) {
      throw new ForbiddenException('This invitation is for another user');
    }

    // Добавляем пользователя в workspace
    const member = await this.prisma.workspaceMember.create({
      data: {
        workspaceId: invite.workspaceId,
        userId,
        role: invite.role,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Помечаем приглашение как принятое
    await this.prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    return {
      workspace: member.workspace,
      role: member.role,
      joinedAt: member.joinedAt,
    };
  }

  // Получить список приглашений пользователя
  async getMyInvites(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
    throw new NotFoundException('User not found');
    }

    const invites = await this.prisma.workspaceInvite.findMany({
      where: {
        email: user.email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        inviter: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invites.map((invite) => ({
      id: invite.id,
      token: invite.token,
      role: invite.role,
      workspace: invite.workspace,
      invitedBy: invite.inviter,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    }));
  }

  // Изменить роль участника
  async updateRole(
    workspaceId: number,
    memberId: number,
    userId: number,
    newRole: string,
  ) {
    // Проверяем права (только admin/owner)
    const currentUserRole = await this.workspaceService.checkRole(
      workspaceId,
      userId,
      ['admin', 'owner'],
    );

    // Получаем информацию о члене
    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found');
    }

    // Нельзя изменить роль owner (только сам owner может передать права)
    if (member.role === 'owner') {
      throw new ForbiddenException('Cannot change owner role');
    }

    // Admin не может назначать admin/owner
    if (currentUserRole === 'admin' && ['admin', 'owner'].includes(newRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Обновляем роль
    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: newRole },
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
    });
  }

  // Удалить участника
  async remove(workspaceId: number, memberId: number, userId: number) {
    // Проверяем права (admin/owner)
    await this.workspaceService.checkRole(workspaceId, userId, [
      'admin',
      'owner',
    ]);

    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found');
    }

    // Нельзя удалить owner
    if (member.role === 'owner') {
      throw new ForbiddenException('Cannot remove workspace owner');
    }

    // Нельзя удалить себя (для этого есть отдельный endpoint leave)
    if (member.userId === userId) {
      throw new BadRequestException('Use leave endpoint to exit workspace');
    }

    await this.prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return { message: 'Member removed successfully' };
  }

  // Покинуть workspace
  async leave(workspaceId: number, userId: number) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this workspace');
    }

    // Owner не может просто покинуть workspace
    if (member.role === 'owner') {
      throw new BadRequestException(
        'Owner must transfer ownership or delete workspace',
      );
    }

    await this.prisma.workspaceMember.delete({
      where: { id: member.id },
    });

    return { message: 'Successfully left workspace' };
  }
}
