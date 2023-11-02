import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getBotToken } from 'nestjs-telegraf';
// import { config } from 'dotenv';
// config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const bot = app.get(getBotToken());
  app.use(bot.webhookCallback('/bot'));
  app.setGlobalPrefix('api');
  app.enableCors();
  await app.listen(3030);
}
bootstrap();
