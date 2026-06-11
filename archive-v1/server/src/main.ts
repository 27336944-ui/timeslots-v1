import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

/**
 * 应用启动入口。
 *
 * 职责：
 * 1. 创建 NestJS 应用实例（根 Module = `AppModule`）
 * 2. 注册全局：
 *    - `ValidationPipe`（class-validator 校验 + 自动类型转换 + 严格白名单）
 *    - `AllExceptionsFilter`（异常 → `{code: businessCode, data: null, message, path, timestamp}`）
 *    - `TransformInterceptor`（成功 → `{code: 0, data, message: 'success'}`）
 * 3. 监听端口（默认 7777，从 ConfigService 读取）
 *
 * URL 前缀：各 Controller 自带 `api/v1` 路径（避免与全局 prefix 双重叠加）。
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = config.get<number>('port', 7777);
  await app.listen(port);
  Logger.log(
    `Server running on port ${port} (${config.get<string>('nodeEnv')})`,
    'Bootstrap',
  );
}

void bootstrap();
