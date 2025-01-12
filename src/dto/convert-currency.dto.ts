import { IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConvertCurrencyDto {
    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 1000, description: 'Currency from Amount' })
    amount: number;

    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 840, description: 'Currency from. 840 - USD' })
    currencyFrom: number;

    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 980, description: 'Currency to. 980 - UAH' })
    currencyTo: number;
}