import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  // Отправить заявку в друзья
  async sendRequest(requesterId: number, addresseeId: number) {
    if (requesterId === addresseeId) throw new ForbiddenException('Нельзя добавить самого себя');
    // Проверить, не существует ли уже дружба
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId }
        ]
      }
    });
    if (existing) throw new ConflictException('Заявка уже существует или вы уже друзья');

    return this.prisma.friendship.create({
      data: {
        requesterId,
        addresseeId,
        status: 'pending'
      }
    });
  }

  // Принять заявку в друзья
  async acceptRequest(userId: number, friendshipId: number) {
    const friendship = await this.prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship) throw new NotFoundException('Заявка не найдена');
    if (friendship.addresseeId !== userId) throw new ForbiddenException('Нет прав на подтверждение');
    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'accepted' }
    });
  }

  // Отклонить или удалить заявку/друга
  async removeFriendship(userId: number, friendshipId: number) {
    const friendship = await this.prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship) throw new NotFoundException('Не найдено');
    if (friendship.addresseeId !== userId && friendship.requesterId !== userId)
      throw new ForbiddenException('Нет прав');
    return this.prisma.friendship.delete({ where: { id: friendshipId } });
  }

  // Получить список друзей
  async getFriends(userId: number) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ requesterId: userId }, { addresseeId: userId }]
      }
    });
    // Получаем id всех друзей
    const friendIds = friendships.map(f =>
      f.requesterId === userId ? f.addresseeId : f.requesterId
    );
    return this.prisma.user.findMany({
      where: { id: { in: friendIds } },
      select: { id: true, name: true, avatarUrl: true }
    });
  }

  // Получить входящие и исходящие заявки
  async getRequests(userId: number) {
    return this.prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: 'pending' },
          { addresseeId: userId, status: 'pending' }
        ]
      },
      include: {
        requester: { select: { id: true, name: true, avatarUrl: true } },
        addressee: { select: { id: true, name: true, avatarUrl: true } }
      }
    });
  }
}
