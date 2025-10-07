import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import * as qs from 'qs';
import { v4 as uuidv4 } from 'uuid'; 


interface GigaChatAuthResponse {
  access_token: string;
  expires_at: number;
}

interface GigaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GigaChatRequest {
  model: string;
  messages: GigaChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

interface GigaChatResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    index: number;
    finish_reason: string;
  }>;
  created: number;
  model: string;
  object: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

@Injectable()
export class GigaChatService {
  private readonly authUrl = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
  private readonly apiUrl = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';
  
  private readonly authKey: string;
  private readonly scope: string;
  private readonly model: string;
  private readonly axiosInstance: AxiosInstance;

  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private configService: ConfigService) {
    this.authKey = this.configService.get<string>('GIGACHAT_AUTH_KEY')!;
    this.scope = this.configService.get<string>('GIGACHAT_SCOPE', 'GIGACHAT_API_PERS');
    this.model = this.configService.get<string>('GIGACHAT_MODEL', 'GigaChat');

    if (!this.authKey) {
      throw new Error('GigaChat AUTH_KEY not configured');
    }

    // Создаём axios instance с отключенной проверкой SSL
    console.warn('⚠️  Development mode: Certificate verification disabled');
    this.axiosInstance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
      timeout: 30000,
    });
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      console.log('✅ Using cached access token');
      return this.accessToken;
    }

    try {
      console.log('🔑 Requesting new access token...');
      
      const rquid = this.generateRqUID();
      
      // Используем qs.stringify как в примере
      const data = qs.stringify({
        scope: this.scope,
      });

      console.log('   RqUID:', rquid);
      console.log('   Scope:', this.scope);
      console.log('   Data:', data);

      const response = await this.axiosInstance.post(
        this.authUrl,
        data,
        {
          headers: {
            'RqUID': rquid,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${this.authKey}`,
          },
        }
      );

      console.log('📡 Auth response status:', response.status);

      const responseData: GigaChatAuthResponse = response.data;
      
      this.accessToken = responseData.access_token;
      this.tokenExpiresAt = responseData.expires_at;

      console.log('✅ GigaChat access token obtained');
      console.log('   Token (first 30 chars):', this.accessToken.substring(0, 30) + '...');
      console.log('   Expires at:', new Date(this.tokenExpiresAt).toISOString());
      
      return this.accessToken;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
        });
        throw new HttpException(
          `GigaChat auth error: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`,
          error.response?.status || 500
        );
      }
      console.error('❌ GigaChat authentication error:', error);
      throw new HttpException('Failed to authenticate with GigaChat', 500);
    }
  }

   private generateRqUID(): string {
    return uuidv4(); // ⬅️ FIX: используем UUID4
  }

  async generateCompletion(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.6,
    maxTokens: number = 200
  ): Promise<string> {
    const accessToken = await this.getAccessToken();

    const requestBody: GigaChatRequest = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature,
      max_tokens: maxTokens,
      top_p: 0.9,
    };

    try {
      const response = await this.axiosInstance.post(
        this.apiUrl,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const data: GigaChatResponse = response.data;

      if (!data.choices?.[0]?.message?.content) {
        throw new HttpException('Invalid response from GigaChat', 500);
      }

      console.log(`✅ GigaChat response generated (${data.usage.total_tokens} tokens)`);
      return data.choices[0].message.content.trim();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Если токен истёк, пробуем обновить
        if (error.response?.status === 401) {
          this.accessToken = null;
          return this.generateCompletion(systemPrompt, userPrompt, temperature, maxTokens);
        }

        console.error('❌ GigaChat API error:', {
          status: error.response?.status,
          data: error.response?.data,
        });
        throw new HttpException(
          `GigaChat API error: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`,
          error.response?.status || 500
        );
      }
      console.error('❌ GigaChat API error:', error);
      throw new HttpException('Failed to generate AI response', 500);
    }
  }

  async generateMotivation(context: string): Promise<string> {
    const systemPrompt = `Ты — дружелюбный AI-помощник в приложении для отслеживания целей LevelUp.
Твоя задача — мотивировать пользователя продолжать работать над своими целями.

Правила ответа:
- 2-3 коротких предложения
- До 300 символов
- Дружелюбный, но не инфантильный тон
- Используй эмодзи умеренно (1-2 на сообщение)
- Конкретные советы, не общие фразы
- Фокус на действиях, а не на проблемах`;

    return this.generateCompletion(systemPrompt, context, 0.7, 150);
  }

  async generateInsight(context: string): Promise<string> {
    const systemPrompt = `Ты — аналитический AI-помощник в приложении LevelUp.
Твоя задача — находить интересные паттерны в поведении пользователя и давать инсайты.

Правила ответа:
- 2-3 предложения
-До 300 символов
- Начинай с "Заметил интересное:", "Интересный паттерн:", "Обрати внимание:"
- Фокус на данных и фактах
- Предлагай как использовать этот паттерн
- Используй эмодзи 📊 📈 💡`;

    return this.generateCompletion(systemPrompt, context, 0.5, 150);
  }

  async generateCelebration(context: string): Promise<string> {
    const systemPrompt = `Ты — энергичный AI-помощник в приложении LevelUp.
Твоя задача — искренне поздравлять пользователя с достижениями.

Правила ответа:
- 2-3 предложения
- До 30 символов
- Восторженный, но не чрезмерный тон
- Подчеркни конкретное достижение
- Мотивируй продолжать
- Используй эмодзи 🎉 🔥 🎯 ⭐`;

    return this.generateCompletion(systemPrompt, context, 0.8, 150);
  }

  async generateRecommendation(context: string): Promise<string> {
    const systemPrompt = `Ты — мудрый AI-советник в приложении LevelUp.
Твоя задача — давать практичные советы по оптимизации работы с целями.

Правила ответа:
- 2-3 предложения
- До 300 символов
- Конкретные, действенные советы
- Объясни "почему" и "как"
- Тон наставника, а не критика
- Используй эмодзи 💡 🤔 ✨`;

    return this.generateCompletion(systemPrompt, context, 0.6, 150);
  }

  async generateChallenge(context: string): Promise<string> {
    const systemPrompt = `Ты — мотивирующий AI-тренер в приложении LevelUp.
Твоя задача — предлагать интересные вызовы для пользователя.

Правила ответа:
- 2-3 предложения
- До 300 символов
- Формулируй как конкретный вызов
- Указывай награду или результат
- Вдохновляющий тон
- Используй эмодзи 🏆 ⚡ 🎯 💪`;

    return this.generateCompletion(systemPrompt, context, 0.7, 150);
  }
}
