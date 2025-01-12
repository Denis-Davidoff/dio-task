import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { MonobankService } from '@/monobank/monobank.service';
import { RedisService } from './redis/redis.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, MonobankService, RedisService],
})
export class AppModule {}
