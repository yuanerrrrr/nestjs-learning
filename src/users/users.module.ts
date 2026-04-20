import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';

@Module({
  controllers: [UsersController],
  providers: [UserService],
  imports: [TypeOrmModule.forFeature([User])],
  exports: [UserService, TypeOrmModule]  // 导出 UserService、TypeOrmModule，使其他模块可以使用
})
export class UsersModule {}
