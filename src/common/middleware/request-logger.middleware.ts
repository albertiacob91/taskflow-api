import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    const incomingId = req.header('x-request-id');
    const requestId = incomingId && incomingId.trim() ? incomingId : randomUUID();

    // attach to req for handlers if needed
    (req as any).requestId = requestId;

    // expose in response
    res.setHeader('X-Request-Id', requestId);

    res.on('finish', () => {
      const ms = Date.now() - start;
      const method = req.method;
      const url = req.originalUrl || req.url;
      const status = res.statusCode;

      // simple structured log
      // eslint-disable-next-line no-console
      console.log(
        JSON.stringify({
          requestId,
          method,
          url,
          status,
          ms,
        }),
      );
    });

    next();
  }
}