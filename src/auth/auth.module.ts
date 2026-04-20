import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    UsersModule,                      // 导入 UsersModule 以便使用 UsersService
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),  // 生产环境应使用环境变量
        signOptions: {expiresIn: '1d'},           // token 有效期 1 天
      }),
      inject: [ConfigService],
      global: true,                        // 注册全局模块，其他模块可无需引入即可使用
    })
  ],
  providers: [AuthService, JwtStrategy], // 注册守卫和策略
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy],   // 使 AuthService 和 JwtStrategy 在外部可注入
})
export class AuthModule {}
