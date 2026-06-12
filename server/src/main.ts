
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  
  app.useGlobalInterceptors(new TransformInterceptor());

  
  app.useGlobalFilters(new HttpExceptionFilter());

  
  const port = process.env.APP_PORT ? parseInt(process.env.APP_PORT, 10) : 7777;
  await app.listen(port);
  console.warn(`Server running on http://localhost:${port}`);
}

bootstrap();
