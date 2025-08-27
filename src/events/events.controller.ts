import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Request } from 'express';

interface AuthReq extends Request { user: { userId: number; email: string } }

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}
  @Post()
  async create(@Req() req: AuthReq, @Body() dto: CreateEventDto) {
    return this.events.add(req.user.userId, dto);
  }
}
