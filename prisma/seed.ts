import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
   // Сначала чистим связи!
  await prisma.achievementOnUser.deleteMany();
  await prisma.achievement.deleteMany();

  
  await prisma.achievement.createMany({
    data:[
      {
        "code": "FIRST_GOAL",
        "title": "Первая цель!",
        "description": "Создай свою первую цель.",
        "iconUrl": "/uploads/achievements/001-achievement.png",
        "type": "progress",
        "requirement": { "goalsCreated": 1 }
      },
      {
        "code": "TEN_GOALS",
        "title": "10 целей!",
        "description": "Создай 10 целей.",
        "iconUrl": "/uploads/achievements/002-achievement-1.png",
        "type": "progress",
        "requirement": { "goalsCreated": 10 }
      },
      {
        "code": "FIFTY_GOALS",
        "title": "50 целей!",
        "description": "Создай 50 целей.",
        "iconUrl": "/uploads/achievements/003-badge.png",
        "type": "progress",
        "requirement": { "goalsCreated": 50 }
      },

      {
        "code": "FIRST_COMPLETED",
        "title": "Завершена первая цель!",
        "description": "Доведи хотя бы одну цель до конца.",
        "iconUrl": "/uploads/achievements/004-goal.png",
        "type": "progress",
        "requirement": { "goalsCompleted": 1 }
      },
      {
        "code": "FIVE_COMPLETED",
        "title": "5 завершённых целей",
        "description": "Доведи до конца 5 целей.",
        "iconUrl": "/uploads/achievements/005-ladder.png",
        "type": "progress",
        "requirement": { "goalsCompleted": 5 }
      },
      {
        "code": "MARATHON_COMPLETED",
        "title": "Завершён марафон!",
        "description": "Заверши цель с количеством шагов более 100.",
        "iconUrl": "/uploads/achievements/006-achievement-2.png",
        "type": "progress",
        "requirement": { "minStepsInGoal": 100 }
      },

      {
        "code": "STEP_MASTER",
        "title": "Мастер шагов",
        "description": "Сделай 100 шагов по своим целям.",
        "iconUrl": "/uploads/achievements/007-achievement-3.png",
        "type": "progress",
        "requirement": { "stepsMade": 100 }
      },

      {
        "code": "FIRST_STREAK",
        "title": "Первый стрик!",
        "description": "Поддерживай активность 3 дня подряд.",
        "iconUrl": "/uploads/achievements/008-achievement-4.png",
        "type": "streak",
        "requirement": { "streak": 3 }
      },
      {
        "code": "SEVEN_STREAK",
        "title": "7-дневный стрик",
        "description": "Не пропусти ни дня активности целую неделю.",
        "iconUrl": "/uploads/achievements/009-achievement-5.png",
        "type": "streak",
        "requirement": { "streak": 7 }
      },
      {
        "code": "PERFECT_MONTH",
        "title": "Идеальный месяц!",
        "description": "30 дней активности подряд.",
        "iconUrl": "/uploads/achievements/010-struggle.png",
        "type": "streak",
        "requirement": { "streak": 30 }
      },

      {
        "code": "FIRST_FRIEND",
        "title": "Первый друг",
        "description": "Добавь первого друга!",
        "iconUrl": "/uploads/achievements/011-weight-lifting.png",
        "type": "social",
        "requirement": { "friendsAdded": 1 }
      },
      {
        "code": "TEN_FRIENDS",
        "title": "Десятка друзей",
        "description": "Заведи 10 друзей на платформе.",
        "iconUrl": "/uploads/achievements/012-learning.png",
        "type": "social",
        "requirement": { "friendsAdded": 10 }
      },
      {
        "code": "FRIENDLY_COMPETITION",
        "title": "Дружеское соперничество",
        "description": "Выполни цель быстрее, чем друг!",
        "iconUrl": "/uploads/achievements/013-reward.png",
        "type": "social",
        "requirement": { "beatFriend": true }
      },

      {
        "code": "JOINED_FIRST_GROUP",
        "title": "Первая группа",
        "description": "Вступи в первую группу.",
        "iconUrl": "/uploads/achievements/014-table-tennis.png",
        "type": "group",
        "requirement": { "groupsJoined": 1 }
      },
      {
        "code": "GROUP_LEADER",
        "title": "Лидер группы",
        "description": "Стать админом или владельцем группы.",
        "iconUrl": "/uploads/achievements/001-achievement.png",
        "type": "group",
        "requirement": { "becameGroupLeader": true }
      },

      {
        "code": "SHARED_PROGRESS",
        "title": "Показал пример!",
        "description": "Опубликуй первое достижение в ленте.",
        "iconUrl": "/uploads/achievements/002-achievement-1.png",
        "type": "feed",
        "requirement": { "feedEvents": 1 }
      },
      {
        "code": "FEED_STAR",
        "title": "Звезда ленты",
        "description": "Собери 100 лайков к своим событиям.",
        "iconUrl": "/uploads/achievements/003-badge.png",
        "type": "feed",
        "requirement": { "feedLikes": 100 }
      },

      {
        "code": "EARLY_BIRD",
        "title": "Ранний пташка",
        "description": "Первым выполни цель в группе.",
        "iconUrl": "/uploads/achievements/004-goal.png",
        "type": "special",
        "requirement": { "firstInGroupGoal": true }
      },
      {
        "code": "NIGHT_OWL",
        "title": "Ночная сова",
        "description": "Выполни шаг к цели после полуночи.",
        "iconUrl": "/uploads/achievements/005-ladder.png",
        "type": "special",
        "requirement": { "stepAfterMidnight": true }
      },
      {
        "code": "COMEBACK",
        "title": "Возвращение!",
        "description": "Вернись на платформу после перерыва в 30 дней.",
        "iconUrl": "/uploads/achievements/006-achievement-2.png",
        "type": "special",
        "requirement": { "returnedAfterDays": 30 }
      },
      {
        "code": "FEEDBACK_GIVER",
        "title": "Обратная связь",
        "description": "Оставь отзыв о платформе.",
        "iconUrl": "/uploads/achievements/007-achievement-3.png",
        "type": "special",
        "requirement": { "feedbackGiven": true }
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
