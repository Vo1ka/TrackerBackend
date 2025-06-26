import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
  };
}

@Controller('profile')
export class ProfileController {
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
  return { userId: req.user.userId, email: req.user.email };
    }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@Req() req: AuthenticatedRequest, @Body() body: any) {
    // тут твоя логика обновления профиля через prisma
    return { message: 'Обновить профиль', updates: body, userId: req.user.userId };
  }
}
