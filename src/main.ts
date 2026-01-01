import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.setGlobalPrefix('api');
  
  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // CORS конфигурация
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      // Vercel production domain
      'https://stay-mot-beta.vercel.app',
      // Vercel preview domains (без слэша!)
      /^https:\/\/stay-mot-beta-.*\.vercel\.app$/,
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cache-Control',
      'Pragma',
      'Expires',
      'X-Requested-With',
    ],
    credentials: true,
  });

  console.log('Serving static from:', join(__dirname, '..', 'uploads'));

  // Порт из environment variable (Render устанавливает автоматически)
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
}
bootstrap();
