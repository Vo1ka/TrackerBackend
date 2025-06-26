import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  // Добавить событие в ленту
  async addEvent(userId: number, type: string, data: any = {}) {
    return this.prisma.feedEvent.create({
      data: {
        userId,
        type,
        data,
      },
    });
  }

  // Получить ленту пользователя (или друзей)
  async getFeed(userId: number, options?: { friendsIds?: number[], page?: number, pageSize?: number }) {
    const where: any = {
      OR: [{ userId }]
    };
    if (options?.friendsIds && options.friendsIds.length) {
      where.OR.push({ userId: { in: options.friendsIds } });
    }
    return this.prisma.feedEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (options?.page ?? 0) * (options?.pageSize ?? 20),
      take: options?.pageSize ?? 20,
    });
  }
}
