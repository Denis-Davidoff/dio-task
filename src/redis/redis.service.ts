import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from "ioredis";

type RedisValueType = 'string' | 'number' | 'object' | 'boolean';
type RedisResult = string | number | object | boolean;

@Injectable()
export class RedisService implements OnModuleDestroy {
    private client: Redis;

    private readonly logger = new Logger(RedisService.name);

    constructor() {
        this.client = new Redis({
            host: process.env.REDIS_HOST ?? 'localhost',
            port: (process.env.REDIS_PORT && parseInt(process.env.REDIS_PORT)) ?? 6379,
        });
        this.client.on('error', (error) => {
            this.logger.error(error);
        });
        this.client.on('connect', () => {
            this.logger.log('Connected to Redis');
        });
        this.client.on('close', () => {
            this.logger.log('Disconnected from Redis');
        });
        this.client.on('reconnecting', () => {
            this.logger.log('Reconnecting to Redis');
        });
    }

    encodeValue(value: any): string {
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return value.toString();
    }

    decodeValue(value:string, type:RedisValueType): RedisResult {
        switch (type) {
            case 'number':
                return Number(value);
            case 'boolean':
                return Boolean(value);
            case 'object':
                return JSON.parse(value);
            default: // string
                return value;
        }
    }

    async set(key: string, value: any, ttl: number = 0) {
        if (ttl > 0) {
            await this.client.set(key, this.encodeValue(value), 'EX', ttl); // Установка с TTL
        } else {
            await this.client.set(key, this.encodeValue(value));
        }
    }

    async get(key: string, decodeValueType:RedisValueType = 'string'): Promise<RedisResult> {
        let value = await this.client.get(key);
        return this.decodeValue(value, decodeValueType);
    }

    async getObject(key: string): Promise<object> {
        return await this.get(key, 'object') as object;
    }

    async del(key: string): Promise<number> {
        return await this.client.del(key);
    }

    async has(key: string): Promise<boolean> {
        return !!(await this.client.exists(key));
    }

    async onModuleDestroy() {
        await this.client.quit(); // Закрытие подключения при остановке приложения
    }
}