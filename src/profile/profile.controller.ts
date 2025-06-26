import { Controller, Get, Patch, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';
import { ContentModerationService } from 'src/common/content-moderation.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
  };
}

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contentModerationService: ContentModerationService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    // Можно возвращать сразу профиль пользователя из базы:
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, bio: true, avatarUrl: true, privacy: true },
    });
    return user;
  }

  @UseGuards(JwtAuthGuard)
  async updateMe(
  @Req() req: AuthenticatedRequest,
  @Body() body: any,
    ) {
  // Проверка био на запрещённый текст
  if (body.bio) {
    const isOk = await this.contentModerationService.checkText(body.bio);
    if (!isOk) throw new ForbiddenException('Недопустимый текст');
  }
  // Проверка аватарки
  if (body.avatarUrl) {
    const isOk = await this.contentModerationService.checkImage(body.avatarUrl);
    if (!isOk) throw new ForbiddenException('Недопустимое изображение');
  }
    // body: любые поля профиля (name, bio, avatarUrl, privacy)
    const updatedUser = await this.prisma.user.update({
      where: { id: req.user.userId },
      data: {
        name: body.name,
        bio: body.bio,
        avatarUrl: body.avatarUrl,
        privacy: body.privacy,
      },
      select: { id: true, email: true, name: true, bio: true, avatarUrl: true, privacy: true },
    });
    return updatedUser;
  }
}
