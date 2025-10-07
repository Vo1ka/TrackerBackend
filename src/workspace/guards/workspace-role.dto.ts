import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

export enum WorkspaceRole {
  MEMBER = 'member',
  MANAGER = 'manager',
  ADMIN = 'admin',
  OWNER = 'owner',
}

const roleHierarchy = {
  member: 1,
  manager: 2,
  admin: 3,
  owner: 4,
};

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRole = this.reflector.get<WorkspaceRole>(
      'workspaceRole',
      context.getHandler(),
    );

    if (!requiredRole) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const workspaceId = parseInt(request.params.workspaceId);

    if (!userId || !workspaceId) {
      throw new ForbiddenException('Missing user or workspace context');
    }

    // Получаем роль пользователя в workspace
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Проверяем иерархию ролей
    const userRoleLevel = roleHierarchy[member.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      throw new ForbiddenException(
        `Required role: ${requiredRole}, your role: ${member.role}`,
      );
    }

    // Добавляем роль в request для использования в контроллере
    request.workspaceRole = member.role;

    return true;
  }
}
