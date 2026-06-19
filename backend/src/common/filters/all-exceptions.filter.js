import { Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';

export @Catch()
class AllExceptionsFilter {
  constructor() {
    this.logger = new Logger(AllExceptionsFilter.name);
  }

  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.status || HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception.message || 'Internal server error';

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception.stack,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message: [message],
      timestamp: new Date().toISOString(),
    });
  }
}
