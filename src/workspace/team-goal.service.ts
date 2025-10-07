import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceService } from './workspace.service';
import { AddStepDto } from './dto/add-step.dto';
import { CreateTeamGoalDto } from './dto/create-team-goal.dto';

@Injectable()
export class TeamGoalsService {
  constructor(
    private prisma: PrismaService,
    private workspaceService: WorkspaceService,
  ) {}

  // Создать командную цель
  async create(workspaceId: number, userId: number, dto: CreateTeamGoalDto) {
        // Проверяем права (manager, admin, owner)
        await this.workspaceService.checkRole(workspaceId, userId, [
            'manager',
            'admin',
            'owner',
        ]);

        // Если указан owner, проверяем что он является членом workspace
        if (dto.ownerId) {
            const isMember = await this.workspaceService.isMember(
            workspaceId,
            dto.ownerId,
            );
            if (!isMember) {
            throw new ForbiddenException('Owner must be a workspace member');
            }
        }

        const teamGoal = await this.prisma.teamGoal.create({
            data: {
            workspaceId,
            title: dto.title,
            description: dto.description,
            targetValue: dto.targetValue,
            category: dto.category,
            ownerId: dto.ownerId || userId,
            visibility: dto.visibility || 'workspace',
            },
            include: {
            owner: {
                select: {
                id: true,
                name: true,
                avatarUrl: true,
                },
            },
            },
        });

        // ✅ ДОБАВЛЕНО: Возвращаем с вычисленными полями
        return {
            ...teamGoal,
            currentValue: 0,
            progress: 0,
            contributors: [],
            stepsCount: 0,
            contributorsCount: 0,
        };
    }


  // Получить список командных целей
  async findAll(
        workspaceId: number,
        userId: number,
        filters?: {
            status?: string;
            category?: string;
            ownerId?: number;
        },
        ) {
        // Проверяем что пользователь является членом
        const isMember = await this.workspaceService.isMember(workspaceId, userId);
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this workspace');
        }

        const where: any = { workspaceId };

        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.category) {
            where.category = filters.category;
        }
        if (filters?.ownerId) {
            where.ownerId = filters.ownerId;
        }

        const goals = await this.prisma.teamGoal.findMany({
            where,
            include: {
            owner: {
                select: {
                id: true,
                name: true,
                avatarUrl: true,
                },
            },
            contributors: {
                include: {
                user: {
                    select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    },
                },
                },
                orderBy: { contribution: 'desc' },
                take: 5,
            },
            _count: {
                select: {
                steps: true,
                contributors: true,
                },
            },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Вычисляем прогресс для каждой цели
        const goalsWithProgress = await Promise.all(
            goals.map(async (goal) => {
            const totalSteps = await this.prisma.teamGoalStep.aggregate({
                where: { teamGoalId: goal.id },
                _sum: { value: true },
            });

            const currentValue = totalSteps._sum.value || 0;
            const progress = (currentValue / goal.targetValue) * 100;

            return {
                id: goal.id,
                workspaceId: goal.workspaceId, // ✅ ДОБАВЛЕНО!
                title: goal.title,
                description: goal.description,
                targetValue: goal.targetValue,
                currentValue,
                progress: Math.min(progress, 100),
                category: goal.category,
                visibility: goal.visibility,
                status: goal.status,
                owner: goal.owner,
                contributors: goal.contributors,
                stepsCount: goal._count.steps,
                contributorsCount: goal._count.contributors,
                createdAt: goal.createdAt,
                completedAt: goal.completedAt,
            };
            }),
        );

        return goalsWithProgress;
    }


  // Получить детали командной цели
  async findOne(goalId: number, userId: number) {
    const goal = await this.prisma.teamGoal.findUnique({
      where: { id: goalId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        contributors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { contribution: 'desc' },
        },
        steps: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!goal) {
      throw new NotFoundException('Team goal not found');
    }

    // Проверяем что пользователь является членом workspace
    const isMember = await this.workspaceService.isMember(
      goal.workspaceId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenException('Access denied');
    }

    // Вычисляем прогресс
    const totalSteps = await this.prisma.teamGoalStep.aggregate({
      where: { teamGoalId: goal.id },
      _sum: { value: true },
    });

    const currentValue = totalSteps._sum.value || 0;
    const progress = (currentValue / goal.targetValue) * 100;

    return {
      ...goal,
      currentValue,
      progress: Math.min(progress, 100),
    };
  }

  // Добавить шаг к командной цели
  async addStep(goalId: number, userId: number, dto: AddStepDto) {
    const goal = await this.prisma.teamGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException('Team goal not found');
    }

    // Проверяем что пользователь является членом workspace
    const isMember = await this.workspaceService.isMember(
      goal.workspaceId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Проверяем что цель не завершена
    if (goal.status === 'completed') {
      throw new ForbiddenException('Cannot add steps to completed goal');
    }

    // Создаём шаг
    const step = await this.prisma.teamGoalStep.create({
      data: {
        teamGoalId: goalId,
        userId,
        value: dto.value,
        note: dto.note,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Обновляем или создаём contributor
    await this.prisma.teamGoalContributor.upsert({
      where: {
        teamGoalId_userId: {
          teamGoalId: goalId,
          userId,
        },
      },
      create: {
        teamGoalId: goalId,
        userId,
        contribution: dto.value,
      },
      update: {
        contribution: {
          increment: dto.value,
        },
      },
    });

    // Проверяем достижение цели
    const totalSteps = await this.prisma.teamGoalStep.aggregate({
      where: { teamGoalId: goalId },
      _sum: { value: true },
    });

    const currentValue = totalSteps._sum.value || 0;

    if (currentValue >= goal.targetValue && goal.status === 'active') {
      await this.prisma.teamGoal.update({
        where: { id: goalId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });
    }

    return step;
  }

  // Обновить командную цель
  async update(goalId: number, userId: number, data: Partial<CreateTeamGoalDto>) {
    const goal = await this.prisma.teamGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException('Team goal not found');
    }

    // Проверяем права: owner цели или admin/owner workspace
    const userRole = await this.workspaceService.getUserRole(
      goal.workspaceId,
      userId,
    );

     const canEdit =
        goal.ownerId === userId ||
        (userRole !== null && ['admin', 'owner'].includes(userRole));


    if (!canEdit) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.teamGoal.update({
      where: { id: goalId },
      data,
    });
  }

  // Удалить командную цель
  async delete(goalId: number, userId: number) {
    const goal = await this.prisma.teamGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException('Team goal not found');
    }

    // Проверяем права: owner цели или admin/owner workspace
    const userRole = await this.workspaceService.getUserRole(
      goal.workspaceId,
      userId,
    );

    const canDelete =
      goal.ownerId === userId ||
      (userRole !== null && ['admin', 'owner'].includes(userRole));;

    if (!canDelete) {
      throw new ForbiddenException('Insufficient permissions');
    }

    await this.prisma.teamGoal.delete({
      where: { id: goalId },
    });

    return { message: 'Team goal deleted successfully' };
  }
}
