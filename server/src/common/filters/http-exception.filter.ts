import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { BusinessException } from '../exceptions/business-exception';
import { ErrorCodes } from '../exceptions/business-exception';


function extractMessage(exception: HttpException): string {
  const res = exception.getResponse();
  if (typeof res === 'string') return res;
  if (typeof res === 'object') {
    const msg = (res as Record<string, unknown>).message;
    if (Array.isArray(msg)) return (msg as string[]).join('; ');
    if (typeof msg === 'string') return msg;
  }
  return 'Internal server error';
}


function isPrismaError(exception: unknown): exception is Prisma.PrismaClientKnownRequestError {
  return exception instanceof Prisma.PrismaClientKnownRequestError;
}


@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let httpStatus: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let businessCode: number = ErrorCodes.INTERNAL_ERROR;
    let message: string = 'Internal server error';

    if (exception instanceof BusinessException) {
      httpStatus = exception.getStatus();
      businessCode = exception.businessCode;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      businessCode = httpStatus * 100 + 1;
      message = extractMessage(exception);
    } else if (isPrismaError(exception)) {
      switch (exception.code) {
        case 'P2002':
          httpStatus = HttpStatus.CONFLICT;
          businessCode = ErrorCodes.DUPLICATE_ENTRY;
          message = '数据重复';
          break;
        case 'P2025':
          httpStatus = HttpStatus.NOT_FOUND;
          businessCode = ErrorCodes.EVENT_NOT_FOUND;
          message = '记录不存在';
          break;
        default:
          httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
          businessCode = ErrorCodes.DB_ERROR;
          message = '数据库错误';
          break;
      }
    }

    response.status(httpStatus).json({
      code: businessCode,
      message,
      data: null,
      path: request.path,
      timestamp: new Date().toISOString(),
    });
  }
}
