import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AchievementSeed {
  code: string;
  title: string;
  description: string;
  iconUrl: string; // путь к файлу
  type: string;
  requirement: any;
}

const ACHIEVEMENTS: AchievementSeed[] = [
  // ==========================================
  // 🎯 СОЗДАНИЕ ЦЕЛЕЙ
  // ==========================================
  {
    code: 'first_goal',
    title: 'Первый шаг',
    description: 'Создайте свою первую цель',
    iconUrl: '/uploads/achievements/001-achievement.png',
    type: 'goal_count',
    requirement: { count: 1 },
  },
  {
    code: 'goal_5',
    title: 'Целеустремлённый',
    description: 'Создайте 5 целей',
    iconUrl: '/uploads/achievements/002-achievement-1.png',
    type: 'goal_count',
    requirement: { count: 5 },
  },
  {
    code: 'goal_10',
    title: 'Планировщик',
    description: 'Создайте 10 целей',
    iconUrl: '/uploads/achievements/004-goal.png',
    type: 'goal_count',
    requirement: { count: 10 },
  },
  {
    code: 'goal_25',
    title: 'Мастер планирования',
    description: 'Создайте 25 целей',
    iconUrl: '/uploads/achievements/006-achievement-2.png',
    type: 'goal_count',
    requirement: { count: 25 },
  },
  {
    code: 'goal_50',
    title: 'Легенда целей',
    description: 'Создайте 50 целей',
    iconUrl: '/uploads/achievements/007-achievement-3.png',
    type: 'goal_count',
    requirement: { count: 50 },
  },
  {
    code: 'goal_100',
    title: 'Грандмастер',
    description: 'Создайте 100 целей',
    iconUrl: '/uploads/achievements/008-achievement-4.png',
    type: 'goal_count',
    requirement: { count: 100 },
  },

  // ==========================================
  // ✅ ЗАВЕРШЕНИЕ ЦЕЛЕЙ
  // ==========================================
  {
    code: 'complete_1',
    title: 'Победитель',
    description: 'Завершите свою первую цель',
    iconUrl: '/uploads/achievements/003-badge.png',
    type: 'completion',
    requirement: { count: 1 },
  },
  {
    code: 'complete_5',
    title: 'Исполнитель',
    description: 'Завершите 5 целей',
    iconUrl: '/uploads/achievements/009-achievement-5.png',
    type: 'completion',
    requirement: { count: 5 },
  },
  {
    code: 'complete_10',
    title: 'Достигатор',
    description: 'Завершите 10 целей',
    iconUrl: '/uploads/achievements/013-reward.png',
    type: 'completion',
    requirement: { count: 10 },
  },
  {
    code: 'complete_25',
    title: 'Чемпион',
    description: 'Завершите 25 целей',
    iconUrl: '/uploads/achievements/006-achievement-2.png',
    type: 'completion',
    requirement: { count: 25 },
  },

  // ==========================================
  // 🔥 СТРИКИ
  // ==========================================
  {
    code: 'streak_3',
    title: 'На волне',
    description: 'Добавляйте шаги 3 дня подряд',
    iconUrl: '/uploads/achievements/010-struggle.png',
    type: 'streak',
    requirement: { days: 3 },
  },
  {
    code: 'streak_7',
    title: 'Неделя силы',
    description: 'Добавляйте шаги 7 дней подряд',
    iconUrl: '/uploads/achievements/002-achievement-1.png',
    type: 'streak',
    requirement: { days: 7 },
  },
  {
    code: 'streak_14',
    title: 'Две недели мощи',
    description: 'Добавляйте шаги 14 дней подряд',
    iconUrl: '/uploads/achievements/007-achievement-3.png',
    type: 'streak',
    requirement: { days: 14 },
  },
  {
    code: 'streak_30',
    title: 'Месяц триумфа',
    description: 'Добавляйте шаги 30 дней подряд',
    iconUrl: '/uploads/achievements/008-achievement-4.png',
    type: 'streak',
    requirement: { days: 30 },
  },
  {
    code: 'streak_100',
    title: 'Сотня дней',
    description: 'Добавляйте шаги 100 дней подряд',
    iconUrl: '/uploads/achievements/009-achievement-5.png',
    type: 'streak',
    requirement: { days: 100 },
  },

  // ==========================================
  // 💪 СПОРТ
  // ==========================================
  {
    code: 'sport_first_workout',
    title: 'Первая тренировка',
    description: 'Завершите первую спортивную цель',
    iconUrl: '/uploads/achievements/011-weight-lifting.png',
    type: 'sphere_completion',
    requirement: { sphere: 'sport', count: 1 },
  },
  {
    code: 'sport_10_workouts',
    title: 'Спортсмен',
    description: 'Завершите 10 спортивных целей',
    iconUrl: '/uploads/achievements/014-table-tennis.png',
    type: 'sphere_completion',
    requirement: { sphere: 'sport', count: 10 },
  },

  // ==========================================
  // 📚 ОБРАЗОВАНИЕ
  // ==========================================
  {
    code: 'education_first',
    title: 'Ученик',
    description: 'Завершите первую образовательную цель',
    iconUrl: '/uploads/achievements/012-learning.png',
    type: 'sphere_completion',
    requirement: { sphere: 'education', count: 1 },
  },
  {
    code: 'education_10',
    title: 'Эрудит',
    description: 'Завершите 10 образовательных целей',
    iconUrl: '/uploads/achievements/012-learning.png',
    type: 'sphere_completion',
    requirement: { sphere: 'education', count: 10 },
  },

  // ==========================================
  // 🎨 ХОББИ
  // ==========================================
  {
    code: 'hobby_first',
    title: 'Творец',
    description: 'Завершите первую цель в хобби',
    iconUrl: '/uploads/achievements/003-badge.png',
    type: 'sphere_completion',
    requirement: { sphere: 'hobby', count: 1 },
  },

  // ==========================================
  // 📈 ЛИДЕРБОРД
  // ==========================================
  {
    code: 'top_10',
    title: 'Топ-10',
    description: 'Попадите в топ-10 лидерборда',
    iconUrl: '/uploads/achievements/005-ladder.png',
    type: 'leaderboard',
    requirement: { position: 10 },
  },
  {
    code: 'top_3',
    title: 'Тройка лидеров',
    description: 'Попадите в топ-3 лидерборда',
    iconUrl: '/uploads/achievements/005-ladder.png',
    type: 'leaderboard',
    requirement: { position: 3 },
  },
  {
    code: 'top_1',
    title: 'Номер один',
    description: 'Займите 1 место в лидерборде',
    iconUrl: '/uploads/achievements/005-ladder.png',
    type: 'leaderboard',
    requirement: { position: 1 },
  },

  // ==========================================
  // 🌟 ОСОБЫЕ
  // ==========================================
  {
    code: 'early_bird',
    title: 'Ранняя пташка',
    description: 'Добавьте шаг до 6:00 утра',
    iconUrl: '/uploads/achievements/001-achievement.png',
    type: 'special',
    requirement: { time: 'before_6am' },
  },
  {
    code: 'night_owl',
    title: 'Ночная сова',
    description: 'Добавьте шаг после 23:00',
    iconUrl: '/uploads/achievements/001-achievement.png',
    type: 'special',
    requirement: { time: 'after_11pm' },
  },
  {
    code: 'weekend_warrior',
    title: 'Воин выходного дня',
    description: 'Завершите цель в выходные',
    iconUrl: '/uploads/achievements/013-reward.png',
    type: 'special',
    requirement: { weekend: true },
  },
];

export async function seedAchievements() {
  console.log('🏆 Seeding achievements...');

  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: {
        title: achievement.title,
        description: achievement.description,
        iconUrl: achievement.iconUrl,
        type: achievement.type,
        requirement: achievement.requirement,
      },
      create: achievement,
    });
  }

  console.log(`✅ Seeded ${ACHIEVEMENTS.length} achievements`);
}

// Запуск если файл вызван напрямую
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
