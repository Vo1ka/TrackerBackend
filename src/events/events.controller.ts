import { 
  Body, Controller, Get, Post, Query, Req, UseGuards 
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Request } from 'express';

interface AuthReq extends Request { 
  user: { userId: number; email: string } 
}

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Post()
  async create(@Req() req: AuthReq, @Body() dto: CreateEventDto) {
    return this.events.add(req.user.userId, dto);
  }

  @Get()
async getEvents(
  @Req() req: AuthReq,
  @Query('eventType') eventType?: string,
  @Query('sphere') sphere?: string, // << ИЗМЕНЕНО: sphere (string)
  @Query('goalId') goalId?: string,
  @Query('limit') limit?: string,
  @Query('offset') offset?: string,
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
) {
  return this.events.getUserEvents(req.user.userId, {
    eventType,
    sphere, // << ИЗМЕНЕНО
    goalId: goalId ? parseInt(goalId, 10) : undefined,
    limit: limit ? parseInt(limit, 10) : 100,
    offset: offset ? parseInt(offset, 10) : 0,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });
}
}
