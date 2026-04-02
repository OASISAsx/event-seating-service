import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  console.log('DB URL:', process.env.DATABASE_URL); // ✅ เช็คตรงนี้
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api');
  app.enableCors();

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
  console.log(process.env.PORT);
}
bootstrap();
