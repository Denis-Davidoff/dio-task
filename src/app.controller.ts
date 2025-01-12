import { Controller, Post, Get, Body } from '@nestjs/common';
import { ConvertCurrencyDto } from '@/dto/convert-currency.dto';
import { MonobankService } from '@/monobank/monobank.service';
import { AppService } from '@/app.service';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly monobankService: MonobankService) {}

  @Get()
  @ApiOperation({ summary: 'Available currencies IDs list' })
  async index(): Promise<any> {
    return await this.monobankService.availableCurrencies();
  }

  @Post()
  @ApiOperation({ summary: 'Calculating exchange amount. Follow https://api.monobank.ua/bank/currency to get details' })
  @ApiResponse({ status: 201, description: 'Get the result' })
  async convertCurrency(@Body() convertCurrencyDto: ConvertCurrencyDto): Promise<{ result: any }> {
    const { amount, currencyFrom, currencyTo } = convertCurrencyDto;
    const result = await this.monobankService.convert(amount, currencyFrom, currencyTo);
    return { result };
  }

}
