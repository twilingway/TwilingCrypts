import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AppService {
  // constructor(@InjectRepository())

  getHello(): string {
    return 'Hello World!';
  }
}
