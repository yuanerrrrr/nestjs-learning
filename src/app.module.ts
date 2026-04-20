import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DmeoModule } from './demo/dmeo.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env', // 指定环境变量文件路径
      isGlobal: true,      // 全局配置，所有模块均可访问
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: 5432,
      username: process.env.DB_USERNAME || 'lisiyuan04',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'nest_demo',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      autoLoadEntities: true,
      synchronize: true,           // 开发环境自动同步表结构
      logging: true,               // 打印 SQL 日志，方便调试
    }),
    DmeoModule,
    UsersModule,
    AuthModule,
    TasksModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
