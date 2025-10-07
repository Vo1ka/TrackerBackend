// prisma/seeds/achievements.seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAchievements() {
  console.log('🏆 Seeding achievements...');

  const achievements = [
    // ==========================================
    // 🎯 ДОСТИЖЕНИЯ ПО ЦЕЛЯМ
    // ==========================================
    {
      code: 'first_goal',
      title: 'Первый шаг',
      description: 'Создайте свою первую цель',
      iconUrl: '🎯',
      type: 'goal_count',
      requirement: { count: 1 },
    },
    {
      code: 'goal_5',
      title: 'Целеустремлённый',
      description: 'Создайте 5 целей',
      iconUrl: '🎪',
      type: 'goal_count',
      requirement: { count: 5 },
    },
    {
      code: 'goal_10',
      title: 'Планировщик',
      description: 'Создайте 10 целей',
      iconUrl: '📋',
      type: 'goal_count',
      requirement: { count: 10 },
    },
    {
      code: 'goal_25',
      title: 'Мастер планирования',
      description: 'Создайте 25 целей',
      iconUrl: '🗂️',
      type: 'goal_count',
      requirement: { count: 25 },
    },
    {
      code: 'goal_50',
      title: 'Легенда целей',
      description: 'Создайте 50 целей',
      iconUrl: '👑',
      type: 'goal_count',
      requirement: { count: 50 },
    },

    // ==========================================
    // ✅ ДОСТИЖЕНИЯ ПО ЗАВЕРШЕНИЮ
    // ==========================================
    {
      code: 'first_completion',
      title: 'Победитель',
      description: 'Завершите свою первую цель',
      iconUrl: '🏅',
      type: 'completion',
      requirement: { count: 1 },
    },
    {
      code: 'completion_5',
      title: 'Исполнитель',
      description: 'Завершите 5 целей',
      iconUrl: '⭐',
      type: 'completion',
      requirement: { count: 5 },
    },
    {
      code: 'completion_10',
      title: 'Достигатор',
      description: 'Завершите 10 целей',
      iconUrl: '🌟',
      type: 'completion',
      requirement: { count: 10 },
    },
    {
      code: 'completion_25',
      title: 'Чемпион',
      description: 'Завершите 25 целей',
      iconUrl: '🏆',
      type: 'completion',
      requirement: { count: 25 },
    },
    {
      code: 'completion_50',
      title: 'Мастер достижений',
      description: 'Завершите 50 целей',
      iconUrl: '💎',
      type: 'completion',
      requirement: { count: 50 },
    },
    {
      code: 'completion_100',
      title: 'Легенда',
      description: 'Завершите 100 целей',
      iconUrl: '🔥',
      type: 'completion',
      requirement: { count: 100 },
    },

    // ==========================================
    // 🔥 ДОСТИЖЕНИЯ ПО СТРИКАМ
    // ==========================================
    {
      code: 'streak_3',
      title: 'На старте',
      description: 'Поддерживайте стрик 3 дня',
      iconUrl: '🌱',
      type: 'streak',
      requirement: { days: 3 },
    },
    {
      code: 'streak_7',
      title: 'Неделя силы',
      description: 'Поддерживайте стрик 7 дней',
      iconUrl: '💪',
      type: 'streak',
      requirement: { days: 7 },
    },
    {
      code: 'streak_14',
      title: 'Две недели',
      description: 'Поддерживайте стрик 14 дней',
      iconUrl: '🔥',
      type: 'streak',
      requirement: { days: 14 },
    },
    {
      code: 'streak_30',
      title: 'Месяц упорства',
      description: 'Поддерживайте стрик 30 дней',
      iconUrl: '⚡',
      type: 'streak',
      requirement: { days: 30 },
    },
    {
      code: 'streak_60',
      title: 'Два месяца',
      description: 'Поддерживайте стрик 60 дней',
      iconUrl: '🌟',
      type: 'streak',
      requirement: { days: 60 },
    },
    {
      code: 'streak_100',
      title: 'Сотня',
      description: 'Поддерживайте стрик 100 дней',
      iconUrl: '💯',
      type: 'streak',
      requirement: { days: 100 },
    },
    {
      code: 'streak_365',
      title: 'Год без остановки',
      description: 'Поддерживайте стрик 365 дней',
      iconUrl: '🏆',
      type: 'streak',
      requirement: { days: 365 },
    },

    // ==========================================
    // 📚 ДОСТИЖЕНИЯ ПО СФЕРАМ: ОБРАЗОВАНИЕ
    // ==========================================
    {
      code: 'education_first',
      title: 'Студент',
      description: 'Создайте первую цель в сфере Образование',
      iconUrl: '📖',
      type: 'sphere_goal',
      requirement: { sphere: 'education', count: 1 },
    },
    {
      code: 'education_5',
      title: 'Книжный червь',
      description: 'Завершите 5 целей в сфере Образование',
      iconUrl: '📚',
      type: 'sphere_completion',
      requirement: { sphere: 'education', count: 5 },
    },
    {
      code: 'education_expert',
      title: 'Эксперт знаний',
      description: 'Завершите 20 целей в сфере Образование',
      iconUrl: '🎓',
      type: 'sphere_completion',
      requirement: { sphere: 'education', count: 20 },
    },

    // ==========================================
    // 💪 ДОСТИЖЕНИЯ ПО СФЕРАМ: СПОРТ
    // ==========================================
    {
      code: 'sport_first',
      title: 'Новичок в зале',
      description: 'Создайте первую цель в сфере Спорт',
      iconUrl: '🏃',
      type: 'sphere_goal',
      requirement: { sphere: 'sport', count: 1 },
    },
    {
      code: 'sport_5',
      title: 'Атлет',
      description: 'Завершите 5 целей в сфере Спорт',
      iconUrl: '💪',
      type: 'sphere_completion',
      requirement: { sphere: 'sport', count: 5 },
    },
    {
      code: 'sport_warrior',
      title: 'Воин спорта',
      description: 'Завершите 20 целей в сфере Спорт',
      iconUrl: '🥇',
      type: 'sphere_completion',
      requirement: { sphere: 'sport', count: 20 },
    },

    // ==========================================
    // 🎨 ДОСТИЖЕНИЯ ПО СФЕРАМ: ХОББИ
    // ==========================================
    {
      code: 'hobby_first',
      title: 'Творческий старт',
      description: 'Создайте первую цель в сфере Хобби',
      iconUrl: '🎨',
      type: 'sphere_goal',
      requirement: { sphere: 'hobby', count: 1 },
    },
    {
      code: 'hobby_5',
      title: 'Мастер увлечений',
      description: 'Завершите 5 целей в сфере Хобби',
      iconUrl: '🎭',
      type: 'sphere_completion',
      requirement: { sphere: 'hobby', count: 5 },
    },
    {
      code: 'hobby_artist',
      title: 'Художник жизни',
      description: 'Завершите 20 целей в сфере Хобби',
      iconUrl: '🌈',
      type: 'sphere_completion',
      requirement: { sphere: 'hobby', count: 20 },
    },

    // ==========================================
    // 💼 ДОСТИЖЕНИЯ ПО СФЕРАМ: РАБОТА
    // ==========================================
    {
      code: 'work_first',
      title: 'Карьерист',
      description: 'Создайте первую цель в сфере Работа',
      iconUrl: '💼',
      type: 'sphere_goal',
      requirement: { sphere: 'work', count: 1 },
    },
    {
      code: 'work_professional',
      title: 'Профессионал',
      description: 'Завершите 10 целей в сфере Работа',
      iconUrl: '👔',
      type: 'sphere_completion',
      requirement: { sphere: 'work', count: 10 },
    },

    // ==========================================
    // 💰 ДОСТИЖЕНИЯ ПО СФЕРАМ: ФИНАНСЫ
    // ==========================================
    {
      code: 'finance_first',
      title: 'Финансовая грамотность',
      description: 'Создайте первую цель в сфере Финансы',
      iconUrl: '💰',
      type: 'sphere_goal',
      requirement: { sphere: 'finance', count: 1 },
    },
    {
      code: 'finance_investor',
      title: 'Инвестор',
      description: 'Завершите 5 целей в сфере Финансы',
      iconUrl: '💎',
      type: 'sphere_completion',
      requirement: { sphere: 'finance', count: 5 },
    },

    // ==========================================
    // 🏥 ДОСТИЖЕНИЯ ПО СФЕРАМ: ЗДОРОВЬЕ
    // ==========================================
    {
      code: 'health_first',
      title: 'Забота о себе',
      description: 'Создайте первую цель в сфере Здоровье',
      iconUrl: '🏥',
      type: 'sphere_goal',
      requirement: { sphere: 'health', count: 1 },
    },
    {
      code: 'health_wellness',
      title: 'Здоровый образ жизни',
      description: 'Завершите 10 целей в сфере Здоровье',
      iconUrl: '💚',
      type: 'sphere_completion',
      requirement: { sphere: 'health', count: 10 },
    },

    // ==========================================
    // ❤️ ДОСТИЖЕНИЯ ПО СФЕРАМ: ОТНОШЕНИЯ
    // ==========================================
    {
      code: 'relationships_first',
      title: 'Социальный',
      description: 'Создайте первую цель в сфере Отношения',
      iconUrl: '❤️',
      type: 'sphere_goal',
      requirement: { sphere: 'relationships', count: 1 },
    },
    {
      code: 'relationships_harmony',
      title: 'Гармония',
      description: 'Завершите 5 целей в сфере Отношения',
      iconUrl: '💕',
      type: 'sphere_completion',
      requirement: { sphere: 'relationships', count: 5 },
    },

    // ==========================================
    // 📊 ДОСТИЖЕНИЯ ПО АКТИВНОСТИ
    // ==========================================
    {
      code: 'steps_100',
      title: 'Первая сотня',
      description: 'Добавьте 100 шагов к целям',
      iconUrl: '👣',
      type: 'steps_count',
      requirement: { count: 100 },
    },
    {
      code: 'steps_500',
      title: 'Активный',
      description: 'Добавьте 500 шагов к целям',
      iconUrl: '🚶',
      type: 'steps_count',
      requirement: { count: 500 },
    },
    {
      code: 'steps_1000',
      title: 'Тысячник',
      description: 'Добавьте 1000 шагов к целям',
      iconUrl: '🏃',
      type: 'steps_count',
      requirement: { count: 1000 },
    },

    // ==========================================
    // 🌟 СПЕЦИАЛЬНЫЕ ДОСТИЖЕНИЯ
    // ==========================================
    {
      code: 'early_bird',
      title: 'Ранняя пташка',
      description: 'Добавьте шаг к цели до 6:00 утра',
      iconUrl: '🌅',
      type: 'special',
      requirement: { type: 'early_morning' },
    },
    {
      code: 'night_owl',
      title: 'Полуночник',
      description: 'Добавьте шаг к цели после 23:00',
      iconUrl: '🦉',
      type: 'special',
      requirement: { type: 'late_night' },
    },
    {
      code: 'weekend_warrior',
      title: 'Воин выходного дня',
      description: 'Завершите 5 целей в выходные',
      iconUrl: '🎉',
      type: 'special',
      requirement: { type: 'weekend_completions', count: 5 },
    },
    {
      code: 'speed_demon',
      title: 'Скоростной демон',
      description: 'Завершите цель за 1 день',
      iconUrl: '⚡',
      type: 'special',
      requirement: { type: 'fast_completion', days: 1 },
    },
    {
      code: 'marathon_runner',
      title: 'Марафонец',
      description: 'Работайте над одной целью 90 дней',
      iconUrl: '🏃‍♂️',
      type: 'special',
      requirement: { type: 'long_goal', days: 90 },
    },
    {
      code: 'multitasker',
      title: 'Мультитаскер',
      description: 'Работайте над 10 целями одновременно',
      iconUrl: '🤹',
      type: 'special',
      requirement: { type: 'active_goals', count: 10 },
    },
    {
      code: 'perfectionist',
      title: 'Перфекционист',
      description: 'Завершите 10 целей со 100% прогрессом',
      iconUrl: '💯',
      type: 'special',
      requirement: { type: 'perfect_completions', count: 10 },
    },

    // ==========================================
    // 🎊 ПРАЗДНИЧНЫЕ ДОСТИЖЕНИЯ
    // ==========================================
    {
      code: 'new_year_goal',
      title: 'Новогоднее обещание',
      description: 'Создайте цель 1 января',
      iconUrl: '🎆',
      type: 'holiday',
      requirement: { date: '01-01' },
    },
    {
      code: 'birthday_achievement',
      title: 'День рождения',
      description: 'Завершите цель в свой день рождения',
      iconUrl: '🎂',
      type: 'holiday',
      requirement: { type: 'birthday' },
    },

    // ==========================================
    // 🏅 МЕТА-ДОСТИЖЕНИЯ
    // ==========================================
    {
      code: 'achievement_hunter',
      title: 'Охотник за достижениями',
      description: 'Получите 10 достижений',
      iconUrl: '🎖️',
      type: 'meta',
      requirement: { achievements: 10 },
    },
    {
      code: 'achievement_master',
      title: 'Мастер достижений',
      description: 'Получите 25 достижений',
      iconUrl: '🏵️',
      type: 'meta',
      requirement: { achievements: 25 },
    },
    {
      code: 'completionist',
      title: 'Коллекционер',
      description: 'Получите 50 достижений',
      iconUrl: '👑',
      type: 'meta',
      requirement: { achievements: 50 },
    },
  ];

  // Создаём достижения
  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: achievement,
      create: achievement,
    });
  }

  console.log(`✅ Created ${achievements.length} achievements`);
}

// Для запуска отдельно
if (require.main === module) {
  seedAchievements()
    .catch((e) => {
      console.error('❌ Error seeding achievements:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
