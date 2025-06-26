import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeedService } from 'src/feed/feed.service';

interface AchievementRequirement {
  goalsCreated?: number;
  streak?: number;
  friendsAdded?: number;
  // здесь можно добавить любые новые свойства!
}


@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService,
    private readonly feedService: FeedService
  ) {}

  // Получить все ачивки пользователя
  async getUserAchievements(userId: number) {
    return this.prisma.achievementOnUser.findMany({
      where: { userId },
      include: { achievement: true }
    });
  }

  // Получить все доступные типы ачивок (справочник)
  async getAllAchievements() {
    return this.prisma.achievement.findMany();
  }

  // Универсальная проверка и выдача ачивок по всем типам событий
  async checkAndGrantAll(userId: number) {
    const allAchievements = await this.prisma.achievement.findMany();
    const userAchievements = await this.prisma.achievementOnUser.findMany({
      where: { userId },
      select: { achievementId: true }
    });
    const alreadyHave = new Set(userAchievements.map(a => a.achievementId));

    // Считаем нужные параметры один раз!
    const goalsCount = await this.prisma.goal.count({ where: { userId } });
    const friendsCount = await this.prisma.friendship.count({
      where: {
        status: 'accepted',
        OR: [{ requesterId: userId }, { addresseeId: userId }]
      }
    });
    // Например, current streak (если храним в user)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currentStreak = user?.currentStreak ?? 0;

    for (const achievement of allAchievements) {
      if (alreadyHave.has(achievement.id)) continue;
      const req = achievement.requirement as AchievementRequirement;

      // Progress: количество целей
      if (req?.goalsCreated && goalsCount >= req.goalsCreated) {
        await this.prisma.achievementOnUser.create({
          data: { userId, achievementId: achievement.id }
        });
         // Добавляем событие в feed
        await this.feedService.addEvent(
            userId,
            'achievement_unlocked',
            {
            achievementId: achievement.id,
            code: achievement.code,
            title: achievement.title
            }
        );
        continue;
      }

      // Streak: серия дней
      if (req?.streak && currentStreak >= req.streak) {
        await this.prisma.achievementOnUser.create({
          data: { userId, achievementId: achievement.id }
        });
        // Добавляем событие в feed
        await this.feedService.addEvent(
            userId,
            'achievement_unlocked',
            {
            achievementId: achievement.id,
            code: achievement.code,
            title: achievement.title
            }
        );
        continue;
      }

      // Social: количество друзей
      if (req?.friendsAdded && friendsCount >= req.friendsAdded) {
        await this.prisma.achievementOnUser.create({
          data: { userId, achievementId: achievement.id }
        });
        // Добавляем событие в feed
        await this.feedService.addEvent(
            userId,
            'achievement_unlocked',
            {
            achievementId: achievement.id,
            code: achievement.code,
            title: achievement.title
            }
        );
        
        continue;
      }

      // Здесь можешь добавить кастомные условия для special achievements
      // if (req?.custom === 'some_special_case') { ... }
    }
  }
}
