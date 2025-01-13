import {Test, TestingModule} from '@nestjs/testing';
import {MonobankService} from './monobank.service';
import {RedisService} from '@/redis/redis.service';
import * as process from "node:process";

describe('MonobankService', () => {
    let service: MonobankService;
    let redisService: RedisService;

    beforeEach(async () => {
        process.env.MONOBANK_API_URL = 'https://api.monobank.ua/bank/currency';
        process.env.MONOBANK_RATES_TTL = '60';

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MonobankService,
                {
                    provide: RedisService,
                    useValue: {
                        set: jest.fn(),
                        getObject: jest.fn(),
                        get: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<MonobankService>(MonobankService);
        redisService = module.get<RedisService>(RedisService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('updateRates should throw error with errorDescription', async () => {
        jest.spyOn(global, 'fetch').mockImplementation(() =>
            Promise.resolve({
                json: () => Promise.resolve({errorDescription: 'Fetch error'}),
            } as Response)
        );

        await expect(service.updateRates()).rejects.toThrow('Fetch error');
    });

    it('updateRates should throw error on empty result', async () => {
        jest.spyOn(global, 'fetch').mockImplementation(() =>
            Promise.resolve({
                json: () => Promise.resolve([]),
            } as Response)
        );

        await expect(service.updateRates()).rejects.toThrow('Empty rates response');
    });

    it('set redis value on success fetch', async () => {
        const testRates = [
            {currencyCodeA: 1, currencyCodeB: 2, rateBuy: 2.5, rateSell: 2.7},
            {currencyCodeA: 1, currencyCodeB: 3, rateBuy: 3.5, rateSell: 3.7},
        ];

        jest.spyOn(global, 'fetch').mockImplementation(() =>
            Promise.resolve({
                json: () => Promise.resolve(testRates),
            } as Response)
        );

        jest.spyOn(redisService, 'set').mockImplementation((key, value, ttl): Promise<void> => {
                expect(value).toEqual(testRates);
                expect(ttl).toEqual(Number(process.env.MONOBANK_RATES_TTL));
                expect(key).toEqual('monobank');
                return Promise.resolve();
        });

        await service.updateRates();
    });

    it('getRates should return cached data if available', async () => {
        const cachedData = {rates: [
            {currencyCodeA: 1, currencyCodeB: 2, rateBuy: 2.5, rateSell: 2.7},
            {currencyCodeA: 1, currencyCodeB: 3, rateBuy: 3.5, rateSell: 3.7},
        ]};

        jest.spyOn(redisService, 'getObject').mockResolvedValue(cachedData);

        const result = await service.getRates();

        expect(result).toEqual(cachedData);

        expect(redisService.getObject).toHaveBeenCalledWith('monobank');
    });

    it('getRates should call updateRates if no cached data', async () => {
        jest.spyOn(redisService, 'getObject').mockResolvedValue(null);

        const updatedData = {rates: [
            {currencyCodeA: 1, currencyCodeB: 2, rateBuy: 3.5, rateSell: 3.7},
            {currencyCodeA: 1, currencyCodeB: 3, rateBuy: 4.5, rateSell: 4.7},
        ]};

        jest.spyOn(service, 'updateRates').mockResolvedValue(updatedData);

        const result = await service.getRates();

        expect(result).toEqual(updatedData);

        expect(service.updateRates).toHaveBeenCalled();
    });

    it('convert should return correct conversion for single exchange with rateBuy/rateSell values', async () => {
        const rates = [
            {currencyCodeA: 1, currencyCodeB: 3, rateCross: 2.4},
            {currencyCodeA: 2, currencyCodeB: 3, rateBuy: 3, rateSell: 3.7},
            {currencyCodeA: 1, currencyCodeB: 2, rateBuy: 2, rateSell: 2.5},
        ];

        jest.spyOn(service, 'getRates').mockResolvedValue(rates);

        const result12 = await service.convert(100, 1, 2);

        expect(result12).toEqual({
            amount: 200,
            type: 'single',
            exchanges: [1, 2],
        });

        const result21 = await service.convert(100, 2, 1);

        expect(result21).toEqual({
            amount: 40,
            type: 'single',
            exchanges: [2, 1],
        });
    });

    it('convert should return correct conversion for single exchange with rateCross value', async () => {
        const rates = [
            {currencyCodeA: 1, currencyCodeB: 3, rateCross: 2.4},
            {currencyCodeA: 1, currencyCodeB: 4, rateBuy: 2, rateSell: 2.7},
            {currencyCodeA: 1, currencyCodeB: 2, rateCross: 2},
        ];

        jest.spyOn(service, 'getRates').mockResolvedValue(rates);

        const result12 = await service.convert(100, 1, 2);

        expect(result12).toEqual({
            amount: 200,
            type: 'single',
            exchanges: [1, 2],
        });

        const result21 = await service.convert(100, 2, 1);

        expect(result21).toEqual({
            amount: 50,
            type: 'single',
            exchanges: [2, 1],
        });
    });

    it('convert should return correct conversion for double exchange', async () => {
        const rates = [
            {currencyCodeA: 1, currencyCodeB: 2, rateBuy: 3, rateSell: 3.1},
            {currencyCodeA: 3, currencyCodeB: 2, rateCross: 2},
        ];

        jest.spyOn(service, 'getRates').mockResolvedValue(rates);

        const result = await service.convert(100, 1, 3);

        expect(result).toEqual({
            amount: 150,
            type: 'double',
            exchanges: [1, 2, 3],
        });
    });

    it('reject when rates not found', async () => {
        const rates = [
            {currencyCodeA: 1, currencyCodeB: 2, rateBuy: 3, rateSell: 3.1},
            {currencyCodeA: 3, currencyCodeB: 2, rateCross: 2},
        ];

        jest.spyOn(service, 'getRates').mockResolvedValue(rates);

        await expect(service.convert(100, 2, 4)).rejects.toThrow('Exchange direction not found');
    });

    it('contain equal amount of currencies in availableCurrencies', async () => {
        const rates = [
            {currencyCodeA: 1, currencyCodeB: 2, rateBuy: 3, rateSell: 3.1},
            {currencyCodeA: 3, currencyCodeB: 2, rateCross: 2},
            {currencyCodeA: 3, currencyCodeB: 5, rateBuy: 3, rateSell: 3.1},
            {currencyCodeA: 7, currencyCodeB: 9, rateCross: 2},
        ];

        jest.spyOn(service, 'getRates').mockResolvedValue(rates);

        const result = await service.availableCurrencies();

        expect(result.length).toEqual(6);
    });
});