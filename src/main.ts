import 'dotenv/config'
import {NestFactory} from '@nestjs/core';
import {ValidationPipe} from '@nestjs/common';
import {AppModule} from '@/app.module';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {AllExceptionsFilter} from '@/filters/all-exceptions.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Удаляет поля, которых нет в DTO
            forbidNonWhitelisted: true, // Ошибка, если в запросе есть лишние поля
            transform: true, // Автоматически преобразует данные к типам из DTO
        }),
    );

    app.useGlobalFilters(new AllExceptionsFilter());

    // Конфигурация Swagger
    const config = new DocumentBuilder()
        .setTitle('My API')
        .setDescription('API Documentation for My App')
        .setVersion('1.0')
        .addTag('example') // Тег для группировки
        //.addBearerAuth() // Добавить авторизацию
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document); // Доступно по пути /api

    await app.listen(process.env.APP_PORT ?? 3000);
}

bootstrap();
