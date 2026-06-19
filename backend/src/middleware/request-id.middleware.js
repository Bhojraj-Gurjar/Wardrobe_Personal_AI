import { Injectable, NestMiddleware } from '@nestjs/common';

export @Injectable()
class RequestIdMiddleware {
  use(req, res, next) {
    req.requestId =
      req.headers['x-request-id'] ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    res.setHeader('X-Request-Id', req.requestId);
    next();
  }
}
