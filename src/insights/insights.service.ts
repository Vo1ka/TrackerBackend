import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SphereDistribution {
  sphere: string;
  events: number;
  weight: number; // доля от общего числа событий (0-1)
}

export interface BalanceInsight {
  balanceScore: number; // 0-100
  perSphere: SphereDistribution[];
  streakDays: number;
  adherenceRate: number; // 0-1
  lastActiveAt: Date | null;
  totalEvents: number;
  windowDays: number;
}

interface CalendarDay {
  date: string; // YYYY-MM-DD
  count: number; // количество событий
  level: number; // 0-4 (интенсивность для цвета)
}

export interface CalendarInsight {
  days: CalendarDay[];
  totalDays: number;
  activeDays: number;
  totalEvents: number;
}

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить баланс сфер за окно (14 или 30 дней)
   */
  async getBalance(userId: number, windowDays: number = 14): Promise<BalanceInsight> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - windowDays);

    // Получаем события за окно
    const events = await this.prisma.event.findMany({
      where: {
        userId,
        occurredAt: { gte: startDate },
        // Фильтруем только "активные" события (не просмотры)
        eventType: {
          in: [
            'create_goal', 'update_goal', 'complete_goal',
            'create_step', 'complete_step',
            'create_subtask', 'complete_subtask',
          ],
        },
      },
      select: {
        sphere: true,
        occurredAt: true,
      },
      orderBy: { occurredAt: 'asc' },
    });

    this.logger.log(`Found ${events.length} events for user ${userId} in last ${windowDays} days`);

    // Если нет событий — возвращаем пустой результат
    if (events.length === 0) {
      return {
        balanceScore: 0,
        perSphere: [],
        streakDays: 0,
        adherenceRate: 0,
        lastActiveAt: null,
        totalEvents: 0,
        windowDays,
      };
    }

    // Группируем по сферам
    const sphereMap = new Map<string, number>();
    events.forEach(event => {
      if (event.sphere) {
        sphereMap.set(event.sphere, (sphereMap.get(event.sphere) || 0) + 1);
      }
    });

    const totalEvents = events.length;
    const perSphere: SphereDistribution[] = Array.from(sphereMap.entries()).map(
      ([sphere, count]) => ({
        sphere,
        events: count,
        weight: count / totalEvents,
      })
    );

    // Считаем Balance Score (энтропия)
    const balanceScore = this.calculateBalanceScore(perSphere);

    // Считаем streak (серия активных дней)
    const streakDays = this.calculateStreak(events);

    // Считаем adherence rate (регулярность)
    const activeDays = this.getUniqueDaysAsDate(events);
    const adherenceRate = activeDays.size / windowDays;

    // Последняя активность
    const lastActiveAt = events[events.length - 1]?.occurredAt || null;

    return {
      balanceScore: Math.round(balanceScore),
      perSphere: perSphere.sort((a, b) => b.events - a.events), // сортируем по убыванию
      streakDays,
      adherenceRate: Math.round(adherenceRate * 100) / 100, // округляем до 2 знаков
      lastActiveAt,
      totalEvents,
      windowDays,
    };
  }
async getCalendar(userId: number, numDays: number = 90): Promise<CalendarInsight> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - numDays);

  // Получаем события за период
  const events = await this.prisma.event.findMany({
    where: {
      userId,
      occurredAt: { gte: startDate },
      eventType: {
        in: [
          'create_goal', 'update_goal', 'complete_goal',
          'create_step', 'complete_step',
          'create_subtask', 'complete_subtask',
        ],
      },
    },
    select: {
      occurredAt: true,
    },
    orderBy: { occurredAt: 'asc' },
  });

  // Группируем по датам
  const dateMap = new Map<string, number>();
  events.forEach(event => {
    const date = new Date(event.occurredAt);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
  });

  // Создаём массив дней (заполняем пропуски нулями)
  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = numDays - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    const count = dateMap.get(dateKey) || 0;

    // Определяем уровень интенсивности (0-4)
    let level = 0;
    if (count > 0) level = 1;
    if (count >= 3) level = 2;
    if (count >= 5) level = 3;
    if (count >= 10) level = 4;

    days.push({ date: dateKey, count, level });
  }

  const activeDays = Array.from(dateMap.keys()).length;
  const totalEvents = events.length;

  return {
    days,
    totalDays: numDays,
    activeDays,
    totalEvents,
  };
}

  /**
   * Рассчитать Balance Score (энтропия Шеннона)
   */
  private calculateBalanceScore(distribution: SphereDistribution[]): number {
    if (distribution.length === 0) return 0;
    if (distribution.length === 1) return 50; // одна сфера = средний баланс

    // Энтропия Шеннона: H = -Σ(p_i * log2(p_i))
    let entropy = 0;
    for (const { weight } of distribution) {
      if (weight > 0) {
        entropy -= weight * Math.log2(weight);
      }
    }

    // Максимальная энтропия (равномерное распределение)
    const maxEntropy = Math.log2(distribution.length);

    // Нормализуем к 0-100
    const score = (entropy / maxEntropy) * 100;

    return Math.max(0, Math.min(100, score)); // clamp 0-100
  }

  /**
   * Рассчитать streak (серия активных дней подряд)
   */
  private calculateStreak(events: Array<{ occurredAt: Date }>): number {
    if (events.length === 0) return 0;

    const uniqueDays = this.getUniqueDaysAsDate(events);
    const sortedDays = Array.from(uniqueDays).sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    let expectedDate = new Date();
    expectedDate.setHours(0, 0, 0, 0);

    for (const day of sortedDays) {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);

      // Проверяем, что день = ожидаемый или вчера
      const diffDays = Math.floor(
        (expectedDate.getTime() - dayStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0 || diffDays === 1) {
        streak++;
        expectedDate = dayStart;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break; // серия прервалась
      }
    }

    return streak;
  }

  /**
   * Получить уникальные дни (Set)
   */
    private getUniqueDaysAsDate(events: Array<{ occurredAt: Date }>): Set<Date> {
    const daysMap = new Map<string, Date>();
    events.forEach(event => {
        const day = new Date(event.occurredAt);
        day.setHours(0, 0, 0, 0);
        const key = day.toISOString().split('T')[0]; // YYYY-MM-DD
        if (!daysMap.has(key)) {
        daysMap.set(key, day);
        }
    });
    return new Set(daysMap.values());
    }

}
