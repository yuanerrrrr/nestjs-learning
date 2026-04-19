import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule,                      // 导入 UsersModule 以便使用 UsersService
    PassportModule,
    JwtModule.register({
      global: true,
      secret: 'your-secret-key',      // 生产环境应使用环境变量
      signOptions: {expiresIn: '1d'}, // token 有效期 1 天
    })
  ],
  providers: [AuthService, JwtStrategy], // 注册守卫和策略
  controllers: [AuthController]
})
export class AuthModule {}
