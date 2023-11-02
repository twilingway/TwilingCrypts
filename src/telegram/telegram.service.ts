/* eslint-disable prettier/prettier */
import { Logger } from '@nestjs/common';
import { Ctx, Message, On, Start, Update } from 'nestjs-telegraf';

import { ConfigService } from '@nestjs/config';
import { TasksService } from 'src/tasks/tasks.service';
import { Scenes, Telegraf } from 'telegraf';
import { User } from 'node-telegram-bot-api';

type Context = Scenes.SceneContext;

const commands = [
  {
    command: 'start',
    description: 'Start Bot',
  },
  {
    command: 'help',
    description: 'Write short name of the currency',
  },
  {
    command: 'index',
    description: 'Get Top 10 Currencies from Coinmarketcap.com',
  },
];

interface IUser {
  [key: number]: User;
}

interface IStatus {
  users: IUser;
  userCount: number;
  countsH: number;
  counts24h: number;
  countsMonth: number;
}

@Update()
export class TelegramService extends Telegraf<Context> {
  private readonly logger = new Logger(TelegramService.name);
  private _status: IStatus = {
    users: {} as IUser,
    userCount: 0,
    countsH: 0,
    counts24h: 0,
    countsMonth: 0,
  };
  constructor(
    private readonly configService: ConfigService,
    private readonly tasksService: TasksService,
  ) {
    super(configService.get('TELEGRAM_API_TOKEN'));
  }

  async updateStatus(from: User) {
    if (!this._status.users.hasOwnProperty(from.id)) {
      this._status.users[from.id] = from;
      this._status.userCount += 1;
    }
    this._status.countsH += 1;
    this._status.counts24h += 1;
    this._status.countsMonth += 1;
  }

  async clearStatus() {
    this._status.users = {} as IUser;
    this._status.countsH = 0;
    this._status.counts24h = 0;
    this._status.countsMonth = 0;
  }

  @Start()
  async startCommand(@Ctx() ctx: Context) {
    ctx.telegram.setMyCommands(commands);
    console.log('ctx :>> ', ctx);
    console.log('from :>> ', ctx.message.from);
    this.updateStatus(ctx.message.from);

    await ctx.reply(
      `<b>Welcome to TwilingCryptsBot.</b>\nHere you can get the latest cryptocurrency quotes\nTo learn more about the bot's capabilities,\nsee the help section. /help`,
      {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      },
    );
  }

  @On('text')
  async getMessage(@Message('text') message: string, @Ctx() ctx: Context) {
    const mes = message.toLowerCase();

    if (mes === '/statusinfo') {
      await ctx.reply(
        `userCount: ${this._status.userCount}\ncountsH: ${this._status.countsH}\ncounts24h: ${this._status.counts24h}\ncountsMonth: ${this._status.countsMonth}`,
        {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        },
      );
    }

    if (mes === '/clearstatus') {
      await this.clearStatus().then(async () => {
        await ctx.reply(`Статус очищен`, {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        });
      });
    }
    if (mes === '/help' || mes === '/help@TwilingCrypts_bot') {
      const answer =
        'Write short name of the currency. \n' +
        '<b>!BTC, !ETH, !TON</b> so on.\n' +
        'If you specify a currency less than 4 characters long, \n<b>USD it will be appended to the end of the line</b>\n' +
        'For a more precise search, enter the full name of the crypto pair, for example <b>!XRPBTC</b>\n' +
        'Write /index GET TO TOP 10 Currencies from Coinmarketcap.com';
      await ctx.reply(answer, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
    }
    if (mes === '/test') {
      await ctx.reply(
        '<b>bold</b>, <strong>bold</strong>\n' +
          '<i>italic</i>, <em>italic</em>\n' +
          '<u>underline</u>, <ins>underline</ins> \n' +
          '<s>strikethrough</s>, <strike>strikethrough</strike>, <del>strikethrough</del>\n' +
          '<span class="tg-spoiler">spoiler</span>, <tg-spoiler>spoiler</tg-spoiler>\n' +
          '<b>bold <i>italic bold <s>italic bold strikethrough <span class="tg-spoiler">italic bold strikethrough spoiler</span></s> <u>underline italic bold</u></i> bold</b>\n' +
          '<a href="http://www.example.com/">inline URL</a>\n' +
          '<a href="tg://user?id=123456789">inline mention of a user</a>\n' +
          '<tg-emoji emoji-id="5368324170671202286">👍</tg-emoji>\n' +
          '<code>inline fixed-width code</code>\n' +
          '<pre>pre-formatted fixed-width code block</pre>\n' +
          '<pre><code class="language-python">pre-formatted fixed-width code block written in the Python programming language</code></pre>\n' +
          '<b>TEST</b>                            5 пробелов',
        {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        },
      );
    }
    if (
      mes.toLowerCase() === '/index' ||
      mes.toLowerCase() === '/index@TwilingCrypts_bot'
    ) {
      let answer = '<b>Coin       Price                 24h%</b>\n';

      if (!this.tasksService.currencyCoinmarketcap.length) {
        await ctx.reply(
          '<b>TOP 10 Empty. Please try again in 5 minutes later.</b>',
          {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          },
        );
        return;
      }
      this.tasksService.currencyCoinmarketcap.forEach((item) => {
        answer =
          answer +
          `<code><b>${(item?.symbol + '   ')
            .toString()
            .substring(0, 5)}</b>$${item?.quote?.USD?.price
            .toString()
            .substring(0, 8)} ${
            item?.quote?.USD?.percent_change_24h?.toString().includes('-')
              ? ''
              : ' '
          }${Number(item?.quote?.USD?.percent_change_24h).toFixed(
            2,
          )}%</code>\n`;
      });
      try {
        const res = await ctx
          .reply(answer, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          })
          .catch((error) => {
            this.logger.error(error);
            throw 'An error happened!';
          });
        this.updateStatus(ctx.message.from);
        // this.logger.debug('debug:>', res);
      } catch (error) {
        this.logger.error(error);
        throw 'An error happened!';
      }
    }
    if (mes.startsWith('!')) {
      if (this.tasksService.binance.length) {
        const m = mes.substring(1).toUpperCase();
        let symbol: any;
        symbol = this.tasksService.binance.find((item) =>
          item.symbol.includes(m.length <= 4 ? m + 'USD' : m),
        );

        if (symbol) {
          const answer = `💱<b>${
            symbol.symbol
          }:</b>\nLAST: ${symbol.lastPrice.substring(0, 8)} ${
            symbol.priceChangePercent.includes('-') ? '📉' : '📈'
          } ${Number(symbol.priceChangePercent).toFixed(
            2,
          )}%\nBID/ASK: ${symbol.bidPrice.substring(
            0,
            8,
          )}/${symbol.askPrice.substring(
            0,
            8,
          )}\nFROM: <a href="https://www.binance.com/en/trade/${
            symbol.symbol
          }">www.binance.com</a>`;
          const res = await ctx
            .reply(answer, {
              parse_mode: 'HTML',
              disable_web_page_preview: true,
            })
            .catch((error) => {
              this.logger.error(error);
              throw 'An error happened!';
            });
          this.updateStatus(ctx.message.from);
          return;
        }

        symbol = this.tasksService?.bitfinex?.find((item) =>
          item[0].includes(m.length <= 4 ? m + 'USD' : m),
        );

        if (symbol) {
          const answer = `💱<b>${symbol[0].substring(1)}:</b>\nLAST: ${symbol[7]
            .toString()
            .substring(0, 8)} ${
            symbol[6].toString().includes('-') ? '📉' : '📈'
          } ${Number(symbol[6] * 100).toFixed(2)}%\nBID/ASK: ${symbol[1]
            .toString()
            .substring(0, 8)}/${symbol[3]
            .toString()
            .substring(0, 8)}\nFROM: <a href="https://trading.bitfinex.com/t/${
            symbol[0]
          }">www.bitfinex.com/t/${symbol[0]}</a>`;
          await ctx
            .reply(answer, {
              parse_mode: 'HTML',
              disable_web_page_preview: true,
            })
            .catch((error) => {
              this.logger.error(error);
              throw 'An error happened!';
            });
          this.updateStatus(ctx.message.from);
          return;
        }

        if (!symbol) {
          await ctx.reply('<b>Symbol don`t found</b>', {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          });
          this.updateStatus(ctx.message.from);
          return;
        }
      }

      await ctx.reply(
        '<b>Data Empty. Please try again in 1 minutes later.</b>',
        {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        },
      );
      this.updateStatus(ctx.message.from);
    }
  }
}
