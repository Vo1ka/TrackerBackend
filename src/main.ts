import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
  prefix: '/uploads/',
  });
  
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // сюда добавь адреса фронта, с которых будут запросы
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // если используешь куки или авторизацию с credentials
  });
  console.log('Serving static from:', join(__dirname, '..', 'uploads'));

  await app.listen(3000);
}
bootstrap();
