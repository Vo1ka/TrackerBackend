import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.achievement.createMany({
    data: [
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
        code: 'FIRST_STREAK',
        title: 'Первый стрик!',
        description: '3 дня подряд активностей.',
        iconUrl: 'https://example.com/first_streak.png',
        type: 'streak',
        requirement: { streak: 3 }
      },
      // ... другие ачивки
    ]
  });
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
