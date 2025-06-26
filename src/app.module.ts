import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileController } from './profile/profile.controller';


@Module({
  imports: [
    AuthModule,
    PrismaModule,
  ],
  controllers: [ProfileController]
})
export class AppModule {}