import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `Hello from Service two! ${process.env.SERVICE_TWO_ENV_VAR}`;
  }
}
