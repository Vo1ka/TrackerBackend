import { Controller, Get, Query, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { userId: number; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Поиск пользователей по имени/email
  @Get('search')
  async search(
    @Req() req: AuthenticatedRequest,
    @Query('query') query: string
  ) {
    return this.usersService.searchUsers(req.user.userId, query);
  }

  // Публичный профиль пользователя по id
  @Get(':id')
  async getProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(Number(id));
  }
}
