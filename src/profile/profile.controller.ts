import { Controller, Get, Patch, Body, UseGuards, Req, ForbiddenException, Param, UploadedFile, UseInterceptors, Post } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';
import { ContentModerationService } from 'src/common/content-moderation.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';

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
  @Patch('me')
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
  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(__dirname, '..', '..', 'uploads', 'avatars'),
      filename: (req, file, callback) => {
        const ext = path.extname(file.originalname);
        callback(null, uuidv4() + ext);
      }
    })
  }))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any // типизируй под свой AuthenticatedRequest
  ) {
    // Сохрани путь/URL в профиль пользователя:
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await this.prisma.user.update({
      where: { id: req.user.userId },
      data: { avatarUrl }
    });
    return { avatarUrl };
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.prisma.user.findUnique({
      where: { id: Number(id) },
      select: { id: true, name: true, bio: true, avatarUrl: true, privacy: true },
    });
  }
}


