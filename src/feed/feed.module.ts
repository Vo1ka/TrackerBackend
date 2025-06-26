import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [FeedService, PrismaService],
  controllers: [FeedController],
  exports: [FeedService]
})
export class FeedModule {}