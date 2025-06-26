import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileController } from './profile/profile.controller';
import { ContentModerationService } from './common/content-moderation.service';
import { PrismaService } from './prisma/prisma.service';


@Module({
  imports: [
    AuthModule,
    PrismaModule,
  ],
  controllers: [ProfileController],
  providers: [PrismaService, ContentModerationService]
})
export class AppModule {}