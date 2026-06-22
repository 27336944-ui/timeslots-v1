
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';


interface Response<T> {
  code: number;
  message: string;
  data: T;
  path: string;
  timestamp: string;
}


@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  
  private readonly logger = new Logger(TransformInterceptor.name);

  
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const path = request.path;
    
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      this.logger.log(`Request: ${request.method} ${path}`);
    }
    return next.handle().pipe(
      tap((data) => {
        if (isDev) {
          
          this.logger.log(`Response: ${JSON.stringify(data).substring(0, 200)}`);
        }
      }),
      
      map((data) => ({
        code: 0,
        message: 'success',
        data,
        path,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
