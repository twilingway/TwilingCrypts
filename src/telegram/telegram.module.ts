import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
// import { TelegramController } from './telegram.controller';
import { TelegrafModule } from 'nestjs-telegraf';
// import * as LocalSession from 'telegraf-session-local';
import { TasksModule } from 'src/tasks/tasks.module';
import { options } from './telegram-config.factory';

@Module({
  imports: [TelegrafModule.forRootAsync(options()), TasksModule],
  // controllers: [TelegramController],
  providers: [TelegramService],
})
export class TelegramModule {}
