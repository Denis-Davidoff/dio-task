import {Module} from '@nestjs/common';
import {AppController} from '@/app.controller';
import {MonobankService} from '@/monobank/monobank.service';
import {RedisService} from './redis/redis.service';

@Module({
    imports: [],
    controllers: [AppController],
    providers: [MonobankService, RedisService],
})
export class AppModule {
}
