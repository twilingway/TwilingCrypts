import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // constructor(@InjectRepository())

  getHello(): string {
    return 'Hello World!';
  }
}
