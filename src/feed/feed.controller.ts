import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeedService } from './feed.service';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { userId: number; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('feed')
export class FeedController {
  constructor(
    private readonly feedService: FeedService,
    private readonly prisma: PrismaService,
  ) {}

  // Получить ленту пользователя/друзей
  @Get()
  async getFeed(
    @Req() req: AuthenticatedRequest,
    @Query('friends') friends = 'false',
    @Query('page') page = '0',
    @Query('pageSize') pageSize = '20',
  ) {
    let friendsIds: number[] = [];
    if (friends === 'true') {
      // Получаем id друзей текущего пользователя
      const userId = req.user.userId;
      const friendships = await this.prisma.friendship.findMany({
        where: {
          status: 'accepted',
          OR: [{ requesterId: userId }, { addresseeId: userId }]
        }
      });
      friendsIds = friendships.map(f =>
        f.requesterId === userId ? f.addresseeId : f.requesterId
      );
    }
    return this.feedService.getFeed(req.user.userId, {
      friendsIds,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  }
}
