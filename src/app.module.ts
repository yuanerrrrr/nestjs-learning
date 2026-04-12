import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DmeoModule } from './demo/dmeo.module';

@Module({
  imports: [DmeoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
