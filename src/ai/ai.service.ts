import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GigaChatService } from './gigachat.service';
import { 
  InsightsResponseDto, 
  UserAnalyticsDto, 
  GoalProgressDto,
  AiMessageDto 
} from './dto/ai-message.dto';

interface MessageTemplate {
  type: 'celebration' | 'insight' | 'motivation' | 'recommendation' | 'challenge';
  priority: number;
  emoji: string;
  context: string;
  expiresInHours?: number;
}

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private gigaChat: GigaChatService
  ) {}

  // ============================================
  // PUBLIC METHODS
  // ============================================

  /**
   * Получить инсайты для пользователя (с кэшированием и проверкой событий)
   */
  async getInsights(userId: number): Promise<InsightsResponseDto> {
    const lastGenerated = await this.getLastGenerationTime(userId);
    const hoursSinceLastGen = lastGenerated > 0 
      ? (Date.now() - lastGenerated) / (1000 * 60 * 60) 
      : 999;

    console.log(`📊 Insights check for user ${userId}:`);
    console.log(`   Last generated: ${hoursSinceLastGen.toFixed(1)} hours ago`);

    // Проверяем важные события за последние 24 часа
    const hasImportantEvents = await this.checkImportantEvents(userId, lastGenerated);
    console.log(`   Important events: ${hasImportantEvents ? 'YES' : 'NO'}`);

    // Генерируем если:
    // 1. Прошло 24+ часов
    // 2. ИЛИ есть важные события (завершение цели, новый рекорд streak)
    const shouldGenerate = hoursSinceLastGen >= 24 || hasImportantEvents || lastGenerated === 0;

    if (!shouldGenerate) {
      console.log('✅ Using cached insights (no need to regenerate)');
      return this.getCachedInsights(userId);
    }

    console.log('🔄 Generating new insights...');
    
    // Собираем аналитику
    const analytics = await this.getUserAnalytics(userId);
    
    // Определяем что нужно сгенерировать
    const templates = await this.generateInsightTemplates(analytics);
    
    if (templates.length === 0) {
      console.log('ℹ️  No insights to generate at this time');
      return this.getCachedInsights(userId);
    }

    // Генерируем тексты через GigaChat
    const messages = await this.generateMessagesWithGPT(userId, templates);
    
    // Сохраняем в БД
    await this.saveMessages(userId, messages);

    console.log(`✅ Generated ${messages.length} new insights`);

    // Возвращаем свежие инсайты
    return this.getCachedInsights(userId);
  }

  /**
   * Принудительная генерация инсайтов (для триггеров)
   */
  async generateInsightsIfNeeded(userId: number, trigger: string): Promise<void> {
    console.log(`🔔 Trigger: "${trigger}" for user ${userId}`);

    const lastGenerated = await this.getLastGenerationTime(userId);
    const hoursSinceLastGen = lastGenerated > 0
      ? (Date.now() - lastGenerated) / (1000 * 60 * 60)
      : 999;

    // Генерируем только если:
    // 1. Прошло больше 6 часов с последней генерации
    // 2. ИЛИ это важное событие (goal_completed, milestone_reached)
    const importantTriggers = ['goal_completed', 'milestone_reached', 'new_streak_record'];
    const shouldGenerate =
      hoursSinceLastGen > 6 ||
      importantTriggers.includes(trigger);

    if (!shouldGenerate) {
      console.log(`⏭️  Skipping generation (last gen ${hoursSinceLastGen.toFixed(1)}h ago, trigger not important)`);
      return;
    }

    console.log('🔄 Generating insights on trigger...');
    await this.getInsights(userId);
  }

  /**
   * Закрыть сообщение
   */
  async dismissMessage(userId: number, messageId: number): Promise<void> {
    await this.prisma.aiMessage.updateMany({
      where: { id: messageId, userId },
      data: { dismissed: true },
    });
  }

  /**
   * Пометить сообщение как показанное
   */
  async markAsShown(userId: number, messageId: number): Promise<void> {
    await this.prisma.aiMessage.updateMany({
      where: { id: messageId, userId },
      data: { shown: true },
    });
  }

  /**
   * Получить полную аналитику (для дебага/админки)
   */
  async getAnalytics(userId: number): Promise<UserAnalyticsDto> {
    return this.getUserAnalytics(userId);
  }

  // ============================================
  // PRIVATE METHODS - CACHING
  // ============================================

  /**
   * Получить время последней генерации инсайтов
   */
  private async getLastGenerationTime(userId: number): Promise<number> {
    const lastMessage = await this.prisma.aiMessage.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return lastMessage ? lastMessage.createdAt.getTime() : 0;
  }

  /**
   * Проверить наличие важных событий за период
   */
  private async checkImportantEvents(userId: number, since: number): Promise<boolean> {
    const sinceDate = new Date(since);

    // 1. Проверяем завершённые цели за последние 24 часа
    const recentCompletions = await this.prisma.goal.count({
      where: {
        userId,
        completedAt: { gte: sinceDate },
      },
    });

    if (recentCompletions > 0) {
      console.log(`   ✨ Found ${recentCompletions} recently completed goal(s)`);
      return true;
    }

    // 2. Проверяем новый рекорд streak
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true },
    });

    if (user && user.currentStreak && user.longestStreak) {
      const newRecord = user.currentStreak === user.longestStreak && user.currentStreak >= 3;
      if (newRecord) {
        console.log(`   🔥 New streak record: ${user.currentStreak} days`);
        return true;
      }
    }

    // 3. Проверяем milestone (50%, 75%, 100%)
    const recentSteps = await this.prisma.step.count({
      where: {
        goal: { userId },
        createdAt: { gte: sinceDate },
      },
    });

    if (recentSteps >= 5) {
      console.log(`   📈 High activity: ${recentSteps} steps added`);
      return true;
    }

    return false;
  }

  /**
   * Получить кэшированные инсайты
   */
  private async getCachedInsights(userId: number): Promise<InsightsResponseDto> {
    const messages = await this.getActiveMessages(userId);
    const analytics = await this.getUserAnalytics(userId);

    return {
      messages,
      stats: {
        streak: analytics.activity.streak,
        totalProgress: this.calculateTotalProgress(analytics),
        activeGoals: analytics.goals.active,
      },
    };
  }

  // ============================================
  // ANALYTICS - Сбор данных
  // ============================================

  private async getUserAnalytics(userId: number): Promise<UserAnalyticsDto> {
    const [user, goals, activity, patterns, recentGoals] = await Promise.all([
      this.getUserInfo(userId),
      this.getGoalsStats(userId),
      this.getActivityStats(userId),
      this.getPatterns(userId),
      this.getRecentGoalsProgress(userId),
    ]);

    return { user, goals, activity, patterns, recentGoals };
  }

  private async getUserInfo(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, createdAt: true },
    });

    if (!user) throw new Error('User not found');

    const daysActive = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const lastStep = await this.prisma.step.findFirst({
      where: { goal: { userId } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return {
      id: userId,
      daysActive,
      lastActiveDate: lastStep?.createdAt || null,
    };
  }

  private async getGoalsStats(userId: number) {
    const goals = await this.prisma.goal.findMany({
      where: { userId },
      select: { 
        completedAt: true,
        sphere: true,
      },
    });

    const stats = {
      total: goals.length,
      active: goals.filter(g => !g.completedAt).length,
      completed: goals.filter(g => g.completedAt).length,
      abandoned: 0,
      byCategory: {} as Record<string, number>,
    };

    goals.forEach(goal => {
      if (goal.sphere && goal.completedAt) {
        stats.byCategory[goal.sphere] = (stats.byCategory[goal.sphere] || 0) + 1;
      }
    });

    return stats;
  }

  private async getActivityStats(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        currentStreak: true,
        longestStreak: true,
        createdAt: true,
      },
    });

    const steps = await this.prisma.step.findMany({
      where: { goal: { userId } },
      select: { createdAt: true, value: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalSteps = steps.length;
    const lastStepDate = steps[0]?.createdAt || null;
    const daysSinceLastStep = lastStepDate
      ? Math.floor((Date.now() - lastStepDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const daysActive = Math.max(
      1,
      Math.floor((Date.now() - user!.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    );
    const avgStepsPerDay = totalSteps / daysActive;

    return {
      streak: user?.currentStreak || 0,
      longestStreak: user?.longestStreak || 0,
      avgStepsPerDay: parseFloat(avgStepsPerDay.toFixed(2)),
      totalSteps,
      lastStepDate,
      daysSinceLastStep,
    };
  }

  private async getPatterns(userId: number) {
    const steps = await this.prisma.step.findMany({
      where: { goal: { userId } },
      select: { createdAt: true },
    });

    const dayCount: Record<string, number> = {};
    const hourCount: Record<number, number> = {};

    steps.forEach(step => {
      const day = step.createdAt.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = step.createdAt.getHours();
      dayCount[day] = (dayCount[day] || 0) + 1;
      hourCount[hour] = (hourCount[hour] || 0) + 1;
    });

    const mostActiveDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const mostActiveHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const completedGoals = await this.prisma.goal.findMany({
      where: { userId, completedAt: { not: null } },
      select: { createdAt: true, completedAt: true },
    });

    const avgGoalDuration = completedGoals.length > 0
      ? completedGoals.reduce((sum, g) => {
          const days = (g.completedAt!.getTime() - g.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / completedGoals.length
      : 0;

    const allGoals = await this.prisma.goal.count({ where: { userId } });
    const completed = await this.prisma.goal.count({ 
      where: { userId, completedAt: { not: null } } 
    });
    const completionRate = allGoals > 0 ? (completed / allGoals) * 100 : 0;

    return {
      mostActiveDay,
      mostActiveHour: mostActiveHour ? parseInt(mostActiveHour) : null,
      avgGoalDuration: parseFloat(avgGoalDuration.toFixed(2)),
      completionRate: parseFloat(completionRate.toFixed(2)),
    };
  }

  private async getRecentGoalsProgress(userId: number): Promise<GoalProgressDto[]> {
    const goals = await this.prisma.goal.findMany({
      where: { userId },
      include: {
        steps: {
          select: { value: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return goals.map(goal => {
      const currentValue = goal.steps.reduce((sum, s) => sum + (s.value || 0), 0);
      const targetValue = goal.targetValue || 100;
      const progress = targetValue > 0 ? Math.min(100, (currentValue / targetValue) * 100) : 0;

      const now = new Date();
      const daysActive = Math.max(
        1,
        Math.floor((now.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      );

      const lastStepDate = goal.steps[0]?.createdAt || null;
      const daysSinceLastStep = lastStepDate
        ? Math.floor((now.getTime() - lastStepDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const velocity = currentValue / daysActive;
      const remaining = Math.max(0, targetValue - currentValue);
      const daysToComplete = velocity > 0 && remaining > 0 ? Math.ceil(remaining / velocity) : null;

      const expectedProgress = (daysActive / 30) * 100;
      const isRushing = progress > expectedProgress * 1.5;
      const isStagnant = daysSinceLastStep >= 7;

      return {
        goalId: goal.id,
        title: goal.title,
        category: goal.sphere || undefined,
        progress: parseFloat(progress.toFixed(2)),
        currentValue,
        targetValue,
        velocity: parseFloat(velocity.toFixed(2)),
        daysActive,
        daysSinceLastStep,
        daysToComplete,
        isStagnant,
        isRushing,
        estimatedDays: 30,
        completedAt: goal.completedAt || undefined,
      };
    });
  }

  // ============================================
  // AI ENGINE - Генерация контекстов
  // ============================================

  private async generateInsightTemplates(
    analytics: UserAnalyticsDto
  ): Promise<MessageTemplate[]> {
    const messages: MessageTemplate[] = [];

    messages.push(...this.checkCelebrations(analytics));
    messages.push(...this.findPatterns(analytics));
    messages.push(...this.checkMotivation(analytics));
    messages.push(...this.generateRecommendations(analytics));
    messages.push(...this.generateChallenges(analytics));

    return messages.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }

  private checkCelebrations(analytics: UserAnalyticsDto): MessageTemplate[] {
    const messages: MessageTemplate[] = [];

    // Новый рекорд streak
    if (
      analytics.activity.streak > 0 &&
      analytics.activity.streak === analytics.activity.longestStreak &&
      analytics.activity.streak >= 3
    ) {
      messages.push({
        type: 'celebration',
        priority: 5,
        emoji: '🔥',
        context: `Пользователь достиг нового рекорда streak: ${analytics.activity.streak} дней подряд с прогрессом. Это его личный рекорд!`,
        expiresInHours: 24,
      });
    }

    // Недавно завершённые цели
    const recentlyCompleted = analytics.recentGoals.filter(g => {
      if (!g.completedAt) return false;
      const hoursSince = (Date.now() - g.completedAt.getTime()) / (1000 * 60 * 60);
      return hoursSince < 24;
    });

    recentlyCompleted.forEach(goal => {
      const faster = goal.estimatedDays && goal.daysActive < goal.estimatedDays;
      messages.push({
        type: 'celebration',
        priority: 5,
        emoji: '🎉',
        context: `Пользователь завершил цель "${goal.title}". Потребовалось ${goal.daysActive} дней${
          faster ? `, что на ${goal.estimatedDays! - goal.daysActive} дней быстрее прогноза` : ''
        }. Сфера: ${goal.category || 'не указана'}.`,
        expiresInHours: 48,
      });
    });

    // 50% milestone
    const halfwayGoals = analytics.recentGoals.filter(
      g => g.progress >= 50 && g.progress < 55 && g.progress < 100
    );
    if (halfwayGoals.length > 0) {
      const goal = halfwayGoals[0];
      messages.push({
        type: 'celebration',
        priority: 4,
        emoji: '🎯',
        context: `Пользователь достиг 50% прогресса по цели "${goal.title}". Текущий прогресс: ${goal.currentValue}/${goal.targetValue}. Осталось примерно ${goal.daysToComplete || 'несколько'} дней.`,
        expiresInHours: 24,
      });
    }

    return messages;
  }

  private findPatterns(analytics: UserAnalyticsDto): MessageTemplate[] {
    const messages: MessageTemplate[] = [];

    if (analytics.patterns.mostActiveHour !== null && analytics.activity.totalSteps > 10) {
      messages.push({
        type: 'insight',
        priority: 3,
        emoji: '📊',
        context: `Анализ показал: пользователь добавляет больше всего шагов около ${analytics.patterns.mostActiveHour}:00. Всего шагов: ${analytics.activity.totalSteps}. Средняя активность: ${analytics.activity.avgStepsPerDay.toFixed(1)} шагов/день.`,
        expiresInHours: 72,
      });
    }

    if (analytics.patterns.mostActiveDay) {
      messages.push({
        type: 'insight',
        priority: 2,
        emoji: '📅',
        context: `Самый продуктивный день недели: ${analytics.patterns.mostActiveDay}. Пользователь чаще всего добавляет шаги именно в этот день.`,
        expiresInHours: 72,
      });
    }

    const spheres = Object.entries(analytics.goals.byCategory);
    if (spheres.length > 0) {
      const bestSphere = spheres.sort(([, a], [, b]) => b - a)[0];
      if (bestSphere[1] >= 2) {
        messages.push({
          type: 'insight',
          priority: 3,
          emoji: '🎯',
          context: `Статистика показывает: в сфере "${bestSphere[0]}" пользователь завершил ${bestSphere[1]} целей — больше чем в других сферах. Процент завершения: ${analytics.patterns.completionRate.toFixed(0)}%.`,
          expiresInHours: 96,
        });
      }
    }

    if (analytics.activity.avgStepsPerDay > 2 && analytics.activity.streak >= 5) {
      messages.push({
        type: 'insight',
        priority: 3,
        emoji: '📈',
        context: `Отличная динамика: средний прогресс ${analytics.activity.avgStepsPerDay.toFixed(1)} шагов/день, текущий streak ${analytics.activity.streak} дней. Пользователь активно работает над целями.`,
        expiresInHours: 48,
      });
    }

    return messages;
  }

  private checkMotivation(analytics: UserAnalyticsDto): MessageTemplate[] {
        const messages: MessageTemplate[] = [];
        if (
            analytics.activity.daysSinceLastStep >= 3 && 
            analytics.activity.daysSinceLastStep < 30 &&
            analytics.activity.totalSteps > 0 //  только если есть хоть один шаг
        ) {
            const urgency = analytics.activity.daysSinceLastStep >= 7 ? 4 : 3;
            messages.push({
            type: 'motivation',
            priority: urgency,
            emoji: '💪',
            context: `Пользователь не добавлял шаги ${analytics.activity.daysSinceLastStep} дней. У него ${analytics.goals.active} активных целей. Предыдущий streak был ${analytics.activity.longestStreak} дней.`,
            expiresInHours: 24,
            });
        }

         // Приветственное сообщение для новичков
        if (analytics.activity.totalSteps === 0 && analytics.goals.active > 0) {
            messages.push({
            type: 'motivation',
            priority: 5,
            emoji: '🚀',
            context: `Пользователь только что создал ${analytics.goals.active} ${analytics.goals.active === 1 ? 'цель' : 'целей'}, но ещё не добавил ни одного шага. Это первый день его пути. Дай мотивирующий совет с чего начать.`,
            expiresInHours: 48,
            });
            
            return messages; 
        }


        // Стагнирующие цели (только если есть прогресс)
        const stagnantGoals = analytics.recentGoals.filter(
            g => g.isStagnant && g.progress < 100 && g.progress > 0 
        );
        
        if (stagnantGoals.length > 0) {
            const goal = stagnantGoals[0];
            messages.push({
            type: 'motivation',
            priority: 3,
            emoji: '⏰',
            context: `Цель "${goal.title}" без прогресса ${goal.daysSinceLastStep} дней. Прогресс: ${goal.currentValue}/${goal.targetValue} (${goal.progress.toFixed(0)}%). Осталось: ${(goal.targetValue - goal.currentValue).toFixed(0)}.`,
            expiresInHours: 48,
            });
        }

        // Потерянный streak (только если был streak)
        if (
            analytics.activity.longestStreak > 5 && 
            analytics.activity.streak === 0 &&
            analytics.activity.totalSteps > 0 
        ) {
            messages.push({
            type: 'motivation',
            priority: 4,
            emoji: '🔥',
            context: `Рекордный streak пользователя был ${analytics.activity.longestStreak} дней, но сейчас streak обнулился. Последний шаг был ${analytics.activity.daysSinceLastStep} дней назад.`,
            expiresInHours: 48,
            });
        }

        return messages;
        }


  private generateRecommendations(analytics: UserAnalyticsDto): MessageTemplate[] {
    const messages: MessageTemplate[] = [];

    if (analytics.goals.active > 5) {
      const activeWithProgress = analytics.recentGoals.filter(
        g => g.progress > 0 && g.progress < 100
      ).length;

      if (activeWithProgress < analytics.goals.active * 0.5) {
        messages.push({
          type: 'recommendation',
          priority: 4,
          emoji: '🤔',
          context: `У пользователя ${analytics.goals.active} активных целей, но прогресс только по ${activeWithProgress}. Средний прогресс: ${analytics.activity.avgStepsPerDay.toFixed(1)} шагов/день.`,
          expiresInHours: 72,
        });
      }
    }

    const rushingGoals = analytics.recentGoals.filter(g => g.isRushing);
    if (rushingGoals.length > 0) {
      const goal = rushingGoals[0];
      messages.push({
        type: 'recommendation',
        priority: 2,
        emoji: '💡',
        context: `Цель "${goal.title}" движется быстрее плана: скорость ${goal.velocity.toFixed(1)} шагов/день, прогресс ${goal.progress.toFixed(0)}%. Пользователь может завершить цель раньше срока.`,
        expiresInHours: 72,
      });
    }

    if (analytics.activity.avgStepsPerDay < 1 && analytics.activity.totalSteps > 5) {
      messages.push({
        type: 'recommendation',
        priority: 3,
        emoji: '📅',
        context: `Пользователь добавляет шаги нерегулярно: в среднем ${analytics.activity.avgStepsPerDay.toFixed(1)} шагов/день. Всего шагов: ${analytics.activity.totalSteps}. Активных целей: ${analytics.goals.active}.`,
        expiresInHours: 96,
      });
    }

    return messages;
  }

  private generateChallenges(analytics: UserAnalyticsDto): MessageTemplate[] {
    const messages: MessageTemplate[] = [];

    if (analytics.activity.streak >= 5 && analytics.activity.streak < 14) {
      messages.push({
        type: 'challenge',
        priority: 2,
        emoji: '🏆',
        context: `Текущий streak: ${analytics.activity.streak} дней. Предложи челлендж удвоить streak до 14 дней. Рекорд пользователя: ${analytics.activity.longestStreak} дней.`,
        expiresInHours: 168,
      });
    }

    const nearComplete = analytics.recentGoals.filter(g => g.progress >= 80 && g.progress < 100);
    if (nearComplete.length >= 3) {
      messages.push({
        type: 'challenge',
        priority: 3,
        emoji: '⚡',
        context: `У пользователя ${nearComplete.length} целей близки к завершению (80%+). Список: ${nearComplete.map(g => `"${g.title}" (${g.progress.toFixed(0)}%)`).join(', ')}.`,
        expiresInHours: 168,
      });
    }

    if (analytics.activity.streak > 0 && analytics.goals.active > 0) {
      messages.push({
        type: 'challenge',
        priority: 2,
        emoji: '🎯',
        context: `Текущий streak: ${analytics.activity.streak} дней. Активных целей: ${analytics.goals.active}. Предложи челлендж добавить по 1 шагу к каждой цели сегодня.`,
        expiresInHours: 24,
      });
    }

    return messages;
  }

  // ============================================
  // MESSAGE GENERATION & STORAGE
  // ============================================

    private async generateMessagesWithGPT(
    userId: number,
    templates: MessageTemplate[]
    ): Promise<Array<MessageTemplate & { message: string }>> {
    // ⬅️ FIX: Явно указываем тип массива
    const messages: Array<MessageTemplate & { message: string }> = [];

    for (const template of templates) {
        try {
        let generatedText: string;

        switch (template.type) {
            case 'celebration':
            generatedText = await this.gigaChat.generateCelebration(template.context);
            break;
            case 'insight':
            generatedText = await this.gigaChat.generateInsight(template.context);
            break;
            case 'motivation':
            generatedText = await this.gigaChat.generateMotivation(template.context);
            break;
            case 'recommendation':
            generatedText = await this.gigaChat.generateRecommendation(template.context);
            break;
            case 'challenge':
            generatedText = await this.gigaChat.generateChallenge(template.context);
            break;
            default:
            generatedText = template.context;
        }

        messages.push({
            ...template,
            message: generatedText,
        });
        } catch (error) {
        console.error(`Failed to generate ${template.type} message:`, error);
        messages.push({
            ...template,
            message: this.getFallbackMessage(template.type, template.context),
        });
        }
    }

    return messages;
    }


  private getFallbackMessage(type: string, context: string): string {
    const fallbacks = {
      celebration: '🎉 Отличная работа! Продолжай в том же духе!',
      insight: '📊 Интересный паттерн в твоей активности!',
      motivation: '💪 Время вернуться к целям! Даже маленький шаг — это прогресс.',
      recommendation: '💡 Попробуй сфокусироваться на приоритетных целях.',
      challenge: '🏆 Готов к новому вызову? Давай поднимем планку!',
    };
    return fallbacks[type] || context.substring(0, 100);
  }

  private async saveMessages(
    userId: number,
    messages: Array<MessageTemplate & { message: string }>
  ): Promise<void> {
    // Удаляем устаревшие
    await this.prisma.aiMessage.deleteMany({
      where: {
        OR: [
          { userId, dismissed: true, createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          { expiresAt: { lt: new Date() } },
        ],
      },
    });

    // Проверяем дубликаты
    const existing = await this.prisma.aiMessage.findMany({
      where: { userId, dismissed: false },
      select: { type: true, message: true },
    });

    const newMessages = messages.filter(msg => {
      return !existing.some(
        ex => ex.type === msg.type && this.isSimilarMessage(ex.message, msg.message)
      );
    });

    // Сохраняем
    if (newMessages.length > 0) {
      await this.prisma.aiMessage.createMany({
        data: newMessages.map(msg => ({
          userId,
          type: msg.type,
          priority: msg.priority,
          message: msg.message,
          emoji: msg.emoji,
          metadata: { context: msg.context },
          expiresAt: msg.expiresInHours
            ? new Date(Date.now() + msg.expiresInHours * 60 * 60 * 1000)
            : null,
        })),
      });
    }
  }

  private async getActiveMessages(userId: number): Promise<AiMessageDto[]> {
    const messages = await this.prisma.aiMessage.findMany({
      where: {
        userId,
        shown: false,
        dismissed: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 5,
    });

    return messages.map(msg => ({
      id: msg.id,
      type: msg.type as any,
      priority: msg.priority,
      message: msg.message,
      emoji: msg.emoji || '💡',
      metadata: msg.metadata as Record<string, any>,
      shown: msg.shown,
      dismissed: msg.dismissed,
      createdAt: msg.createdAt,
      expiresAt: msg.expiresAt || undefined,
    }));
  }

  // ============================================
  // HELPERS
  // ============================================

  private isSimilarMessage(msg1: string, msg2: string): boolean {
    return msg1.substring(0, 30) === msg2.substring(0, 30);
  }

  private calculateTotalProgress(analytics: UserAnalyticsDto): number {
    if (analytics.recentGoals.length === 0) return 0;
    const avgProgress = analytics.recentGoals.reduce((sum, g) => sum + g.progress, 0) / analytics.recentGoals.length;
    return parseFloat(avgProgress.toFixed(2));
  }
}
