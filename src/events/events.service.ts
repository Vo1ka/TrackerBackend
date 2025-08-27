import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  private clampToNow(date?: string): Date {
    const now = new Date();
    if (!date) return now;
    const d = new Date(date);
    // защитимся от будущего времени >5 минут
    if (d.getTime() - now.getTime() > 5 * 60 * 1000) return now;
    return d;
  }

  async add(userId: number, dto: CreateEventDto) {
    const occurredAt = this.clampToNow(dto.occurredAt);
    try {
      const created = await this.prisma.event.create({
        data: {
          userId,
          eventType: dto.eventType,
          occurredAt,
          payload: dto.payload,
          clientEventId: dto.clientEventId,
          source: dto.source,
          sphereId: dto.sphereId,
          goalId: dto.goalId,
          stepId: dto.stepId,
        },
      });
      return { id: created.id, duplicate: false };
    } catch (e: any) {
      // если настроишь уникальный индекс на (user_id, client_event_id) — ловим конфликт
      if (e.code === 'P2002') {
        const existing = await this.prisma.event.findFirst({
          where: { userId, clientEventId: dto.clientEventId ?? '' },
          select: { id: true },
        });
        return { id: existing?.id, duplicate: true };
      }
      throw e;
    }
  }
}
