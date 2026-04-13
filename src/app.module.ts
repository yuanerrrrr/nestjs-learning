import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DmeoModule } from './demo/dmeo.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [DmeoModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
