// src/ai/ai.controller.ts

import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { InsightsResponseDto, UserAnalyticsDto } from './dto/ai-message.dto';
import { GigaChatService } from './gigachat.service';

@ApiTags('AI Assistant')
@Controller('ai')  // ⬅️ УБРАЛИ @UseGuards отсюда
export class AiController {
  constructor(
    private aiService: AiService,
    private gigaChatService: GigaChatService
  ) {}

  // ⬅️ БЕЗ АВТОРИЗАЦИИ (для теста)
  @Get('test-gigachat')
  @ApiOperation({ summary: 'Тест GigaChat API' })
  async testGigaChat() {
    try {
      const result = await this.gigaChatService.generateMotivation(
        'Пользователь не добавлял шаги 5 дней. У него 3 активные цели. Предыдущий streak был 10 дней.'
      );
      return {
        success: true,
        message: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ⬅️ С АВТОРИЗАЦИЕЙ
  @Get('insights')
  @UseGuards(JwtAuthGuard)  // ⬅️ Добавили guard на метод
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить AI инсайты и рекомендации' })
  async getInsights(@Req() req: any): Promise<InsightsResponseDto> {
    return this.aiService.getInsights(req.user.userId);
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить полную аналитику пользователя' })
  async getAnalytics(@Req() req: any): Promise<UserAnalyticsDto> {
    return this.aiService.getAnalytics(req.user.userId);
  }

  @Post('messages/:id/dismiss')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Закрыть AI сообщение' })
  async dismissMessage(@Req() req: any, @Param('id') id: string): Promise<{ success: boolean }> {
    await this.aiService.dismissMessage(req.user.userId, parseInt(id));
    return { success: true };
  }

  @Post('messages/:id/shown')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Пометить сообщение как показанное' })
  async markAsShown(@Req() req: any, @Param('id') id: string): Promise<{ success: boolean }> {
    await this.aiService.markAsShown(req.user.userId, parseInt(id));
    return { success: true };
  }
}
