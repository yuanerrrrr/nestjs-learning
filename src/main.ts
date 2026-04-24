import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingIntercptor } from './common/interceptors/logging.interceptor';
// 确保 crypto 模块在全局可用
import * as crypto from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = crypto;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,                // 自动剔除 DTO 中未定义的字段
      forbidNonWhitelisted: true,     // 存在未定义字段时抛出错误
      transform: true,                // 自动将路径参数/查询参数转换为 DTO 定义的类型
    }),
  );
  // 注册全局拦截器，统一处理返回格式
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingIntercptor());
  // 注册全局异常过滤器，统一处理异常
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
