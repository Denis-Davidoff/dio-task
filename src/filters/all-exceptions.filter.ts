import {ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {

    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;

        let message = 'Internal server error';

        if (exception instanceof HttpException) {
            let responseException = exception.getResponse();
            message = (responseException as any)?.message?.join('. ') || responseException.toString()
            status = exception.getStatus();
        } else if (exception instanceof Error) {
            message = exception.message;
        } else if (typeof exception === 'string') {
            message = exception;
        } else if (typeof exception === 'object') {
            message = exception.toString();
        }

        // Логирование в NestJS, можно добавить логирование в Sentry, Watchdog или другой сервис
        this.logger.error(`[${new Date().toISOString()}] ${status} Error: ${message}`);

        // Ответ клиенту
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            error: message,
        });
    }
}