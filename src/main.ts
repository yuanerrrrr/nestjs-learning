import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,                // 自动剔除 DTO 中未定义的字段
      forbidNonWhitelisted: true,     // 存在未定义字段时抛出错误
      transform: true,                // 自动将路径参数/查询参数转换为 DTO 定义的类型
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
