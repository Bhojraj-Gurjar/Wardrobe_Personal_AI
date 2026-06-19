import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { tap } from 'rxjs/operators';

export @Injectable()
class LoggingInterceptor {
  constructor() {
    this.logger = new Logger(LoggingInterceptor.name);
  }

  intercept(context, next) {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`${method} ${url} - ${Date.now() - now}ms`);
      }),
    );
  }
}
