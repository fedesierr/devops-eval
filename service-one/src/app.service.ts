import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `Hello from Service One! ${process.env.SERVICE_ONE_ENV_VAR}`;
  }
}
