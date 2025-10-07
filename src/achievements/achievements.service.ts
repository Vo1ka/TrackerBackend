// src/achievements/achievements.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AchievementRequirement {
  count?: number;
  days?: number;
  sphere?: string;
  position?: number;
  time?: string;
  weekend?: boolean;
}

@Injectable()
export class AchievementsService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // ОСНОВНЫЕ МЕТОДЫ
  // ==========================================

  /**
   * Получить достижения пользователя (только разблокированные)
   */
  async getUserAchievements(userId: number) {
    console.log('📋 getUserAchievements - userId:', userId);

    const userAchievements = await this.prisma.achievementOnUser.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: {
        achievedAt: 'desc',
      },
    });

    console.log('✅ Found user achievements:', userAchievements.length);
    return userAchievements;
  }

  /**
   * Получить ВСЕ достижения (unlocked + locked)
   */
  async getAllAchievements(userId: number) {
    console.log('📋 getAllAchievements - userId:', userId);

    // Получаем разблокированные достижения пользователя
    const unlocked = await this.getUserAchievements(userId);

    // Получаем все достижения из справочника
    const allAchievements = await this.prisma.achievement.findMany({
      orderBy: { id: 'asc' },
    });

    console.log('📊 All achievements in DB:', allAchievements.length);

    // Находим заблокированные
    const unlockedIds = new Set(unlocked.map((ua) => ua.achievementId));
    const locked = allAchievements.filter((a) => !unlockedIds.has(a.id));

    console.log('✅ Unlocked:', unlocked.length, 'Locked:', locked.length);

    return {
      unlocked,
      locked,
    };
  }

  // ==========================================
  // ПРОВЕРКА И ВЫДАЧА ДОСТИЖЕНИЙ
  // ==========================================

  /**
   * Проверяет все условия достижений и выдаёт новые
   */
  async checkAndGrantAll(userId: number): Promise<string[]> {
    console.log('🏆 Checking achievements for user:', userId);

    const grantedCodes: string[] = [];

    try {
      // Получаем уже полученные достижения
      const userAchievements = await this.prisma.achievementOnUser.findMany({
        where: { userId },
        select: { achievementId: true },
      });
      const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

      // Получаем все достижения
      const allAchievements = await this.prisma.achievement.findMany();

      // Проверяем каждое достижение
      for (const achievement of allAchievements) {
        // Пропускаем уже полученные
        if (unlockedIds.has(achievement.id)) continue;

        // Проверяем условие
        const isGranted = await this.checkAchievementCondition(userId, achievement);

        if (isGranted) {
          // Выдаём достижение
          await this.grantAchievement(userId, achievement.id);
          grantedCodes.push(achievement.code);
          console.log('🎉 Achievement granted:', achievement.code);
        }
      }

      console.log('✅ Achievements check completed. Granted:', grantedCodes.length);
    } catch (error) {
      console.error('❌ Error checking achievements:', error);
    }

    return grantedCodes;
  }

  /**
   * Проверяет условие конкретного достижения
   */
  private async checkAchievementCondition(
    userId: number,
    achievement: any,
  ): Promise<boolean> {
    const { type, requirement } = achievement;

    // Если нет требований, не выдаём
    if (!requirement) {
      console.warn('⚠️ Achievement has no requirement:', achievement.code);
      return false;
    }

    try {
      switch (type) {
        case 'goal_count':
          return await this.checkGoalCount(userId, requirement as AchievementRequirement);

        case 'completion':
          return await this.checkCompletion(userId, requirement as AchievementRequirement);

        case 'streak':
          return await this.checkStreak(userId, requirement as AchievementRequirement);

        case 'sphere_completion':
          return await this.checkSphereCompletion(userId, requirement as AchievementRequirement);

        case 'leaderboard':
          // TODO: Реализовать когда будет лидерборд
          return false;

        case 'special':
          return await this.checkSpecial(userId, requirement as AchievementRequirement);

        default:
          console.warn('⚠️ Unknown achievement type:', type);
          return false;
      }
    } catch (error) {
      console.error('❌ Error checking condition for achievement:', achievement.code, error);
      return false;
    }
  }

  /**
   * Выдаёт достижение пользователю
   */
  private async grantAchievement(userId: number, achievementId: number) {
    try {
      await this.prisma.achievementOnUser.create({
        data: {
          userId,
          achievementId,
          achievedAt: new Date(),
        },
      });
      console.log('✅ Achievement granted:', achievementId);
    } catch (error) {
      console.error('❌ Error granting achievement:', error);
    }
  }

  // ==========================================
  // ПРОВЕРКИ УСЛОВИЙ
  // ==========================================

  /**
   * Проверка: создано N целей
   */
  private async checkGoalCount(userId: number, requirement: AchievementRequirement): Promise<boolean> {
    if (!requirement.count) return false;

    const count = await this.prisma.goal.count({
      where: { userId },
    });

    console.log(`📊 Goal count: ${count} / ${requirement.count}`);
    return count >= requirement.count;
  }

  /**
   * Проверка: завершено N целей
   */
  private async checkCompletion(userId: number, requirement: AchievementRequirement): Promise<boolean> {
    if (!requirement.count) return false;

    const count = await this.prisma.goal.count({
      where: {
        userId,
        completedAt: { not: null },
      },
    });

    console.log(`✅ Completed goals: ${count} / ${requirement.count}`);
    return count >= requirement.count;
  }

  /**
   * Проверка: стрик N дней
   */
  private async checkStreak(userId: number, requirement: AchievementRequirement): Promise<boolean> {
    if (!requirement.days) return false;

    // Получаем текущий стрик из User
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true },
    });

    const currentStreak = user?.currentStreak || 0;
    console.log(`🔥 Current streak: ${currentStreak} / ${requirement.days}`);
    
    return currentStreak >= requirement.days;
  }

  /**
   * Проверка: завершено N целей в определённой сфере
   */
  private async checkSphereCompletion(userId: number, requirement: AchievementRequirement): Promise<boolean> {
    if (!requirement.count || !requirement.sphere) return false;

    const count = await this.prisma.goal.count({
      where: {
        userId,
        sphere: requirement.sphere,
        completedAt: { not: null },
      },
    });

    console.log(`🎯 Sphere ${requirement.sphere} completed: ${count} / ${requirement.count}`);
    return count >= requirement.count;
  }

  /**
   * Проверка: специальные условия
   */
  private async checkSpecial(userId: number, requirement: AchievementRequirement): Promise<boolean> {
    // Ранняя пташка (шаг до 6:00)
    if (requirement.time === 'before_6am') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const earlyStep = await this.prisma.step.findFirst({
        where: {
          goal: { userId },
          createdAt: {
            gte: today,
            lt: new Date(today.getTime() + 6 * 60 * 60 * 1000), // До 6:00
          },
        },
      });

      console.log('🌅 Early bird check:', !!earlyStep);
      return !!earlyStep;
    }

    // Ночная сова (шаг после 23:00)
    if (requirement.time === 'after_11pm') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lateStep = await this.prisma.step.findFirst({
        where: {
          goal: { userId },
          createdAt: {
            gte: new Date(today.getTime() + 23 * 60 * 60 * 1000), // После 23:00
          },
        },
      });

      console.log('🦉 Night owl check:', !!lateStep);
      return !!lateStep;
    }

    // Воин выходного дня
    if (requirement.weekend) {
      const weekendGoal = await this.prisma.goal.findFirst({
        where: {
          userId,
          completedAt: { not: null },
        },
      });

      if (weekendGoal?.completedAt) {
        const day = new Date(weekendGoal.completedAt).getDay();
        const isWeekend = day === 0 || day === 6; // 0 = воскресенье, 6 = суббота
        console.log('🎮 Weekend warrior check:', isWeekend);
        return isWeekend;
      }
    }

    return false;
  }

  // ==========================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ==========================================

  /**
   * Проверить конкретное достижение по коду
   */
  async checkAndGrantByCode(userId: number, code: string): Promise<boolean> {
    const achievement = await this.prisma.achievement.findUnique({
      where: { code },
    });

    if (!achievement) {
      console.warn('⚠️ Achievement not found:', code);
      return false;
    }

    // Проверяем что ещё не получено
    const existing = await this.prisma.achievementOnUser.findFirst({
      where: {
        userId,
        achievementId: achievement.id,
      },
    });

    if (existing) {
      console.log('ℹ️ Achievement already granted:', code);
      return false; // Уже получено
    }

    // Проверяем условие
    const isGranted = await this.checkAchievementCondition(userId, achievement);

    if (isGranted) {
      await this.grantAchievement(userId, achievement.id);
      return true;
    }

    return false;
  }

  /**
   * Получить прогресс для достижения (для UI)
   */
  async getAchievementProgress(userId: number, achievementId: number): Promise<number> {
    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
    });

    if (!achievement || !achievement.requirement) return 0;

    const { type, requirement } = achievement;
    const req = requirement as AchievementRequirement;

    try {
      switch (type) {
        case 'goal_count': {
          if (!req.count) return 0;
          const count = await this.prisma.goal.count({ where: { userId } });
          return Math.min(100, Math.round((count / req.count) * 100));
        }

        case 'completion': {
          if (!req.count) return 0;
          const count = await this.prisma.goal.count({
            where: { userId, completedAt: { not: null } },
          });
          return Math.min(100, Math.round((count / req.count) * 100));
        }

        case 'streak': {
          if (!req.days) return 0;
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { currentStreak: true },
          });
          const currentStreak = user?.currentStreak || 0;
          return Math.min(100, Math.round((currentStreak / req.days) * 100));
        }

        case 'sphere_completion': {
          if (!req.count || !req.sphere) return 0;
          const count = await this.prisma.goal.count({
            where: {
              userId,
              sphere: req.sphere,
              completedAt: { not: null },
            },
          });
          return Math.min(100, Math.round((count / req.count) * 100));
        }

        default:
          return 0;
      }
    } catch (error) {
      console.error('❌ Error calculating progress:', error);
      return 0;
    }
  }

  /**
   * Получить статистику достижений пользователя
   */
  async getUserAchievementStats(userId: number) {
    const [total, unlocked] = await Promise.all([
      this.prisma.achievement.count(),
      this.prisma.achievementOnUser.count({ where: { userId } }),
    ]);

    const progress = total > 0 ? Math.round((unlocked / total) * 100) : 0;

    return {
      total,
      unlocked,
      locked: total - unlocked,
      progress,
    };
  }

  /**
   * Получить последние N достижений пользователя
   */
  async getRecentAchievements(userId: number, limit: number = 5) {
    return this.prisma.achievementOnUser.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: {
        achievedAt: 'desc',
      },
      take: limit,
    });
  }
}
