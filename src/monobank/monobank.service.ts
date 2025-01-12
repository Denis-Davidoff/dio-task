import { Injectable, Logger } from '@nestjs/common';
import {RedisService} from "@/redis/redis.service";
import {from} from "rxjs";

@Injectable()
export class MonobankService {

    private readonly logger = new Logger(MonobankService.name);

    constructor(private readonly redisService: RedisService) {}

    async updateRates(): Promise<any> {
        let data = await fetch(process.env.MONOBANK_API_URL);
        let json = await data.json();
        if (json.errorDescription) {
            throw new Error(json.errorDescription);
        }
        await this.redisService.set('monobank', json, 60); // 1 minute
        this.logger.log('Rates updated');
        return json;
    }

    async getRates(): Promise<any> {
        let data = await this.redisService.getObject('monobank');
        if (data) {
            this.logger.log('Rates from cache');
            return data;
        }
        return await this.updateRates();
    }

    async availableCurrencies(): Promise<any> {
        let rates = await this.getRates();
        let currencies = rates.map((rate: any) => rate.currencyCodeA).concat(rates.map((rate: any) => rate.currencyCodeB));
        return [...new Set(currencies)].sort((a:number, b:number) => a - b);
    }

    async convert(amount: number, fromCurrency: number, toCurrency: number): Promise<{ type:string, amount:number, exchanges:Array<number> }> {
        let rates = await this.getRates();
        this.logger.log('Rates qty: ' + (rates && rates.length) );

        const ratesMap = new Map();
        for (let rate of rates) {
            if (rate.rateCross) {
                // В случае кросс-курса, оба направления валидны, курс одинаковый, можно конечно сделать иначе
                ratesMap.set(rate.currencyCodeA+'-'+rate.currencyCodeB, rate.rateCross);
                ratesMap.set(rate.currencyCodeB+'-'+rate.currencyCodeA, rate.rateCross);
            } else {
                // В случае наличия курса покупки и продажи, используем их
                ratesMap.set(rate.currencyCodeA+'-'+rate.currencyCodeB, rate.rateBuy);
                ratesMap.set(rate.currencyCodeB+'-'+rate.currencyCodeA, rate.rateSell);
            }
        }

        if (ratesMap.has(fromCurrency+'-'+toCurrency)) {
            return {
                amount: amount * ratesMap.get(fromCurrency+'-'+toCurrency),
                type: 'single',
                exchanges: [fromCurrency, toCurrency]
            }
        }

        // В целом не обязательная часть, но в Монобанке она есть, называется двойная конверсия
        for (let rate1 of ratesMap) {
            let [ currencyFrom1, currencyTo1 ] = rate1[0].split('-');
            if (Number(currencyFrom1) === fromCurrency) {
                for (let rate2 of ratesMap) {
                    let [ currencyFrom2, currencyTo2 ] = rate2[0].split('-');
                    if (currencyFrom2 == currencyTo1 && Number(currencyTo2) == toCurrency) {
                        const conversion1 = ratesMap.get(currencyFrom1+'-'+currencyTo1);
                        const conversion2 = ratesMap.get(currencyFrom2+'-'+currencyTo2);
                        return {
                            amount: amount * conversion1 * conversion2,
                            type: 'double',
                            exchanges: [currencyFrom1, currencyTo1, currencyTo2]
                        }
                    }
                }
            }
        }

        throw new Error('Exchange direction not found');
    }

}
