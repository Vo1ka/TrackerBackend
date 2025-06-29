import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
   // Сначала чистим связи!
  await prisma.achievementOnUser.deleteMany();
  await prisma.achievement.deleteMany();

  
  await prisma.achievement.createMany({
    data: [
      // Прогресс по целям
      {
        code: 'FIRST_GOAL',
        title: 'Первая цель!',
        description: 'Создай свою первую цель.',
        iconUrl: 'https://example.com/first_goal.png',
        type: 'progress',
        requirement: { goalsCreated: 1 }
      },
      {
        code: 'TEN_GOALS',
        title: '10 целей!',
        description: 'Создай 10 целей.',
        iconUrl: 'https://example.com/ten_goals.png',
        type: 'progress',
        requirement: { goalsCreated: 10 }
      },
      {
        code: 'FIFTY_GOALS',
        title: '50 целей!',
        description: 'Создай 50 целей.',
        iconUrl: 'https://example.com/fifty_goals.png',
        type: 'progress',
        requirement: { goalsCreated: 50 }
      },

      // Завершённые цели
      {
        code: 'FIRST_COMPLETED',
        title: 'Завершена первая цель!',
        description: 'Доведи хотя бы одну цель до конца.',
        iconUrl: 'https://example.com/first_completed.png',
        type: 'progress',
        requirement: { goalsCompleted: 1 }
      },
      {
        code: 'FIVE_COMPLETED',
        title: '5 завершённых целей',
        description: 'Доведи до конца 5 целей.',
        iconUrl: 'https://example.com/five_completed.png',
        type: 'progress',
        requirement: { goalsCompleted: 5 }
      },
      {
        code: 'MARATHON_COMPLETED',
        title: 'Завершён марафон!',
        description: 'Заверши цель с количеством шагов более 100.',
        iconUrl: 'https://example.com/marathon_completed.png',
        type: 'progress',
        requirement: { minStepsInGoal: 100 }
      },

      // Шаги
      {
        code: 'STEP_MASTER',
        title: 'Мастер шагов',
        description: 'Сделай 100 шагов по своим целям.',
        iconUrl: 'https://example.com/step_master.png',
        type: 'progress',
        requirement: { stepsMade: 100 }
      },

      // Стрики
      {
        code: 'FIRST_STREAK',
        title: 'Первый стрик!',
        description: 'Поддерживай активность 3 дня подряд.',
        iconUrl: 'https://example.com/first_streak.png',
        type: 'streak',
        requirement: { streak: 3 }
      },
      {
        code: 'SEVEN_STREAK',
        title: '7-дневный стрик',
        description: 'Не пропусти ни дня активности целую неделю.',
        iconUrl: 'https://example.com/seven_streak.png',
        type: 'streak',
        requirement: { streak: 7 }
      },
      {
        code: 'PERFECT_MONTH',
        title: 'Идеальный месяц!',
        description: '30 дней активности подряд.',
        iconUrl: 'https://example.com/perfect_month.png',
        type: 'streak',
        requirement: { streak: 30 }
      },

      // Социалка
      {
        code: 'FIRST_FRIEND',
        title: 'Первый друг',
        description: 'Добавь первого друга!',
        iconUrl: 'https://example.com/first_friend.png',
        type: 'social',
        requirement: { friendsAdded: 1 }
      },
      {
        code: 'TEN_FRIENDS',
        title: 'Десятка друзей',
        description: 'Заведи 10 друзей на платформе.',
        iconUrl: 'https://example.com/ten_friends.png',
        type: 'social',
        requirement: { friendsAdded: 10 }
      },
      {
        code: 'FRIENDLY_COMPETITION',
        title: 'Дружеское соперничество',
        description: 'Выполни цель быстрее, чем друг!',
        iconUrl: 'https://example.com/friendly_competition.png',
        type: 'social',
        requirement: { beatFriend: true }
      },

      // Группы
      {
        code: 'JOINED_FIRST_GROUP',
        title: 'Первая группа',
        description: 'Вступи в первую группу.',
        iconUrl: 'https://example.com/joined_first_group.png',
        type: 'group',
        requirement: { groupsJoined: 1 }
      },
      {
        code: 'GROUP_LEADER',
        title: 'Лидер группы',
        description: 'Стать админом или владельцем группы.',
        iconUrl: 'https://example.com/group_leader.png',
        type: 'group',
        requirement: { becameGroupLeader: true }
      },

      // Лента (feed) и активность
      {
        code: 'SHARED_PROGRESS',
        title: 'Показал пример!',
        description: 'Опубликуй первое достижение в ленте.',
        iconUrl: 'https://example.com/shared_progress.png',
        type: 'feed',
        requirement: { feedEvents: 1 }
      },
      {
        code: 'FEED_STAR',
        title: 'Звезда ленты',
        description: 'Собери 100 лайков к своим событиям.',
        iconUrl: 'https://example.com/feed_star.png',
        type: 'feed',
        requirement: { feedLikes: 100 }
      },

      // Особые (special)
      {
        code: 'EARLY_BIRD',
        title: 'Ранний пташка',
        description: 'Первым выполни цель в группе.',
        iconUrl: 'https://example.com/early_bird.png',
        type: 'special',
        requirement: { firstInGroupGoal: true }
      },
      {
        code: 'NIGHT_OWL',
        title: 'Ночная сова',
        description: 'Выполни шаг к цели после полуночи.',
        iconUrl: 'https://example.com/night_owl.png',
        type: 'special',
        requirement: { stepAfterMidnight: true }
      },
      {
        code: 'COMEBACK',
        title: 'Возвращение!',
        description: 'Вернись на платформу после перерыва в 30 дней.',
        iconUrl: 'https://example.com/comeback.png',
        type: 'special',
        requirement: { returnedAfterDays: 30 }
      },
      {
        code: 'FEEDBACK_GIVER',
        title: 'Обратная связь',
        description: 'Оставь отзыв о платформе.',
        iconUrl: 'https://example.com/feedback_giver.png',
        type: 'special',
        requirement: { feedbackGiven: true }
      }
    ]
  });
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
