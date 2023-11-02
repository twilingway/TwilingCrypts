import { ConfigService } from '@nestjs/config';
import {
  TelegrafModuleAsyncOptions,
  TelegrafModuleOptions,
} from 'nestjs-telegraf';

const telegrafModuleOptions = (
  configService: ConfigService,
): TelegrafModuleOptions => {
  return {
    token: configService.get('TELEGRAM_API_TOKEN'),

    launchOptions: {
      webhook: {
        domain: 'https://frequency-english-bot.twiling.ru',
        hookPath: '/bot',
      },
    },
  };
};

export const options = (): TelegrafModuleAsyncOptions => {
  return {
    inject: [ConfigService],
    useFactory: (configService: ConfigService) =>
      telegrafModuleOptions(configService),
  };
};
