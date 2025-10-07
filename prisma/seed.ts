// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import { seedAchievements } from './seeds/achievements.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Очистка старых данных (опционально)
  if (process.env.CLEAR_DB === 'true') {
    console.log('🗑️  Clearing existing data...');
    await prisma.achievementOnUser.deleteMany();
    await prisma.achievement.deleteMany();
    console.log('✅ Data cleared\n');
  }

  // Сидирование достижений
  await seedAchievements();

  console.log('\n✅ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
