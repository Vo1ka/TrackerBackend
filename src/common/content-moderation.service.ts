import { Injectable } from '@nestjs/common';

// Здесь позже будет реальная интеграция с AI/ML
@Injectable()
export class ContentModerationService {
  async checkText(text: string): Promise<boolean> {
    // TODO: Подключить реальный AI-фильтр
    // Сейчас всегда "разрешено"
    return true;
  }

  async checkImage(url: string): Promise<boolean> {
    // TODO: Подключить проверку изображения через AI
    return true;
  }
}
