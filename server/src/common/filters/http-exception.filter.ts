
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';


@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    
    let message = 'Internal server error';
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object') {
        const msg = (res as Record<string, unknown>).message;
        if (Array.isArray(msg)) {
          
          message = (msg as string[]).join('; ');
        } else if (typeof msg === 'string') {
          message = msg;
        }
      }
    }

    
    response.status(status).json({
      code: status * 100,
      message,
      data: null,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
