import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeedService } from '../feed/feed.service';
import { EventsService } from '../events/events.service';

interface AchievementRequirement {
  goalsCreated?: number;
  streak?: number;
  friendsAdded?: number;
  // можно добавить любые новые свойства
}

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly feedService: FeedService,
    private readonly eventsService: EventsService, // << ДОБАВЛЕНО
  ) {}

  /**
   * Получить все достижения пользователя
   */
  async getUserAchievements(userId: number) {
    return this.prisma.achievementOnUser.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { achievedAt: 'desc' },
    });
  }

  /**
   * Получить все доступные достижения (справочник)
   */
  async getAllAchievements() {
    return this.prisma.achievement.findMany({
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Универсальная проверка и выдача достижений
   */
  async checkAndGrantAll(userId: number) {
    try {
      const allAchievements = await this.prisma.achievement.findMany();
      const userAchievements = await this.prisma.achievementOnUser.findMany({
        where: { userId },
        select: { achievementId: true },
      });
      const alreadyHave = new Set(userAchievements.map(a => a.achievementId));

      // Считаем метрики один раз
      const [goalsCount, friendsCount, user] = await Promise.all([
        this.prisma.goal.count({ where: { userId } }),
        this.prisma.friendship.count({
          where: {
            status: 'accepted',
            OR: [{ requesterId: userId }, { addresseeId: userId }],
          },
        }),
        this.prisma.user.findUnique({ 
          where: { id: userId },
          select: { currentStreak: true },
        }),
      ]);

      const currentStreak = user?.currentStreak ?? 0;

      this.logger.log(
        `Checking achievements for user ${userId}: goals=${goalsCount}, friends=${friendsCount}, streak=${currentStreak}`
      );

      let grantedCount = 0;

      for (const achievement of allAchievements) {
        if (alreadyHave.has(achievement.id)) continue;

        const req = achievement.requirement as AchievementRequirement;
        let shouldGrant = false;

        // Проверка условий
        if (req?.goalsCreated && goalsCount >= req.goalsCreated) {
          shouldGrant = true;
        } else if (req?.streak && currentStreak >= req.streak) {
          shouldGrant = true;
        } else if (req?.friendsAdded && friendsCount >= req.friendsAdded) {
          shouldGrant = true;
        }

        // Выдача достижения
        if (shouldGrant) {
          await this.grantAchievement(userId, achievement.id);
          grantedCount++;
        }
      }

      this.logger.log(`Granted ${grantedCount} new achievements to user ${userId}`);

      return { granted: grantedCount };
    } catch (error) {
      this.logger.error(
        `Failed to check achievements for user ${userId}`,
        error.stack
      );
      // Не бросаем ошибку, чтобы не ломать основной флоу
      return { granted: 0, error: error.message };
    }
  }

  /**
   * Выдать конкретное достижение пользователю
   * (с защитой от дублей, событиями и фидом)
   */
  private async grantAchievement(userId: number, achievementId: number) {
    try {
      // Проверяем, что ещё не выдано (защита от race condition)
      const existing = await this.prisma.achievementOnUser.findFirst({
        where: { userId, achievementId },
      });

      if (existing) {
        this.logger.warn(
          `Achievement ${achievementId} already granted to user ${userId}`
        );
        return existing;
      }

      // Получаем данные достижения
      const achievement = await this.prisma.achievement.findUnique({
        where: { id: achievementId },
      });

      if (!achievement) {
        this.logger.error(`Achievement ${achievementId} not found`);
        return null;
      }

      // Выдаём достижение (транзакция не нужна, т.к. операции независимы)
      const granted = await this.prisma.achievementOnUser.create({
        data: { userId, achievementId },
      });

      this.logger.log(
        `🏆 Achievement unlocked: ${achievement.code} for user ${userId}`
      );

      // Добавляем в ленту (best-effort, не критично)
      try {
        await this.feedService.addEvent(userId, 'achievement_unlocked', {
          achievementId: achievement.id,
          code: achievement.code,
          title: achievement.title,
        });
      } catch (error) {
        this.logger.warn(`Failed to add feed event: ${error.message}`);
      }

      // Отправляем событие в Event API (для аналитики)
      try {
        await this.eventsService.add(userId, {
          eventType: 'unlock_achievement',
          payload: {
            achievementId: achievement.id,
            code: achievement.code,
            title: achievement.title,
            type: achievement.type,
          },
          source: 'service',
        });
      } catch (error) {
        this.logger.warn(`Failed to track event: ${error.message}`);
      }

      return granted;
    } catch (error) {
      this.logger.error(
        `Failed to grant achievement ${achievementId} to user ${userId}`,
        error.stack
      );
      return null;
    }
  }

  /**
   * Получить прогресс по достижениям (для UI)
   */
  async getAchievementProgress(userId: number) {
    const [goalsCount, friendsCount, user] = await Promise.all([
      this.prisma.goal.count({ where: { userId } }),
      this.prisma.friendship.count({
        where: {
          status: 'accepted',
          OR: [{ requesterId: userId }, { addresseeId: userId }],
        },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true },
      }),
    ]);

    return {
      goalsCreated: goalsCount,
      friendsAdded: friendsCount,
      currentStreak: user?.currentStreak ?? 0,
    };
  }
}
