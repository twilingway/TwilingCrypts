import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';

interface ICoinmarketcap {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  quote: {
    USD: {
      price: number;
      percent_change_24h: string;
    };
  };
}

// interface IBinfinexSymbol {
//   data: Array<Array<any>>;
// }

interface IBinanceSymbol {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

// interface IBinanceResponse {
//   data: IBinanceSymbol[];
// }

interface ICoinmarketcapResponse {
  data: ICoinmarketcap[];
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private _currencyCoinmarketcap: ICoinmarketcap[] = [];
  private _binance: IBinanceSymbol[] = [];
  private _bitfinex: Array<Array<any>> = [];

  constructor(
    private readonly configService: ConfigService, // private
    private readonly httpService: HttpService,
  ) {}

  public set currencyCoinmarketcap(data: ICoinmarketcap[]) {
    if (!data.length) {
      throw new Error('data: Data was bve not empty');
    }

    this._currencyCoinmarketcap = data;
  }

  public get currencyCoinmarketcap() {
    return this._currencyCoinmarketcap;
  }

  public get binance() {
    return this._binance;
  }

  public get bitfinex() {
    return this._bitfinex;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async getTop10Currency(): Promise<AxiosResponse<ICoinmarketcapResponse>> {
    const res = await firstValueFrom(
      this.httpService
        .get<ICoinmarketcapResponse>(
          'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=10&convert=USD',
          {
            headers: {
              'X-CMC_PRO_API_KEY': this.configService.get('COINMARKETCAP_API'),
              Accepts: 'application/json',
            },
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response.data);
            throw 'An error happened!';
          }),
        ),
    );

    this._currencyCoinmarketcap = res.data.data;
    return res;
  }
  @Cron(CronExpression.EVERY_MINUTE)
  async getBinanceSymbols(): Promise<AxiosResponse<IBinanceSymbol[]>> {
    const res = await firstValueFrom(
      this.httpService
        .get<IBinanceSymbol[]>('https://api3.binance.com/api/v3/ticker/24hr')
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response.data);
            throw 'An error happened!';
          }),
        ),
    );

    this._binance = res.data;
    return res;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async getBitfinexSymbols(): Promise<AxiosResponse<Array<Array<any>>>> {
    const res = await firstValueFrom(
      this.httpService
        .get<Array<Array<any>>>(
          'https://api.bitfinex.com/v2/tickers?symbols=ALL',
          {
            headers: {
              accept: 'application/json',
            },
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response.data);
            throw 'An error happened!';
          }),
        ),
    );

    this._bitfinex = res.data;
    return res;
  }
}
