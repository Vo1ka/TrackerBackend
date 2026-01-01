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
  
  app.enableCors({
    origin: ['http://localhost:5173', 
      'http://localhost:3000',
      'https://stay-mot-beta.vercel.app/',
      'https://trackerbackend-so26.onrender.com'
    ], // сюда добавь адреса фронта, с которых будут запросы
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
     allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cache-Control',      // ← ДОБАВЬ
      'Pragma',             // ← ДОБАВЬ
      'Expires',            // ← ДОБАВЬ
      'X-Requested-With',
    ],

    credentials: true, // если используешь куки или авторизацию с credentials
  });
  console.log('Serving static from:', join(__dirname, '..', 'uploads'));

  await app.listen(3000);
}
bootstrap();
