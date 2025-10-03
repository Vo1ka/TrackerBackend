import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly MAX_PAYLOAD_SIZE = 10 * 1024; // 10KB

  constructor(private readonly prisma: PrismaService) {}

  private clampToNow(date?: string): Date {
    const now = new Date();
    if (!date) return now;
    const d = new Date(date);
    if (d.getTime() - now.getTime() > 5 * 60 * 1000) return now;
    return d;
  }

  private validatePayloadSize(payload?: Record<string, unknown>): void {
    if (!payload) return;
    const size = JSON.stringify(payload).length;
    if (size > this.MAX_PAYLOAD_SIZE) {
      throw new BadRequestException(
        `Payload size ${size} bytes exceeds limit ${this.MAX_PAYLOAD_SIZE} bytes`
      );
    }
  }

  async add(userId: number, dto: CreateEventDto) {
    this.validatePayloadSize(dto.payload);
    const occurredAt = this.clampToNow(dto.occurredAt);
    
    try {
      const created = await this.prisma.event.create({
        data: {
          userId,
          eventType: dto.eventType,
          occurredAt,
          payload: (dto.payload || {}) as Prisma.InputJsonValue,
          clientEventId: dto.clientEventId,
          source: dto.source || 'web',
          sphere: dto.sphere, // << ИЗМЕНЕНО: sphere (string)
          goalId: dto.goalId,
          stepId: dto.stepId,
        },
      });

      this.logger.log(
        `Event created: ${dto.eventType} for user ${userId}, id=${created.id}`
      );

      return { id: created.id, duplicate: false };
    } catch (e: any) {
      if (e.code === 'P2002' && dto.clientEventId) {
        this.logger.warn(
          `Duplicate event: ${dto.eventType}, clientEventId=${dto.clientEventId}`
        );

        const existing = await this.prisma.event.findFirst({
          where: { userId, clientEventId: dto.clientEventId },
          select: { id: true },
        });

        return { id: existing?.id, duplicate: true };
      }

      this.logger.error(`Failed to create event: ${dto.eventType}`, e.stack);
      throw e;
    }
  }

  async getUserEvents(
    userId: number, 
    options?: {
      eventType?: string;
      sphere?: string; // << ИЗМЕНЕНО: sphere (string)
      goalId?: number;
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const where: any = { userId };

    if (options?.eventType) where.eventType = options.eventType;
    if (options?.sphere) where.sphere = options.sphere; // << ИЗМЕНЕНО
    if (options?.goalId) where.goalId = options.goalId;
    
    if (options?.startDate || options?.endDate) {
      where.occurredAt = {};
      if (options.startDate) where.occurredAt.gte = options.startDate;
      if (options.endDate) where.occurredAt.lte = options.endDate;
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        take: options?.limit || 100,
        skip: options?.offset || 0,
      }),
      this.prisma.event.count({ where }),
    ]);

    return { events, total };
  }

}
