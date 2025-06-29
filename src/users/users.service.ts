import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Поиск пользователей по имени или email, с фильтрацией друзей и себя
  async searchUsers(userId: number, query: string) {
    if (!query || query.length < 2) return [];
    // Получаем все дружбы, чтобы исключить уже друзей и заявки
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { addresseeId: userId }
        ]
      }
    });
    const excludedIds = new Set<number>([
      userId,
      ...friendships.map(f => f.requesterId === userId ? f.addresseeId : f.requesterId)
    ]);

    return this.prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ],
        id: { notIn: Array.from(excludedIds) }
      },
      select: { id: true, name: true, avatarUrl: true }
    });
  }

  // Получить публичный профиль пользователя по id (без приватных полей)
  async getPublicProfile(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true
        // Добавь нужные поля, кроме приватных/email
      }
    });
  }
}
