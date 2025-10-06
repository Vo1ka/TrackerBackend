import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GigaChatService } from './gigachat.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [AiController],
  providers: [
    AiService,
    GigaChatService
  ],
  exports: [AiService],
})
export class AiModule {}