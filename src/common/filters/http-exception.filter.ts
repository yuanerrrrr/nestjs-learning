import {HttpException, ExceptionFilter, ArgumentsHost, Catch, HttpStatus, Logger} from '@nestjs/common';
import {Response, Request} from 'express';


// 实现自定义异常过滤器
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal Server Error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            message = typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as any).message || message;
        } else {
            // 非HttpException的异常，打印日志
            this.logger.error(`Unhandled exception: ${exception}`);
        }

        response.status(status).json({
            code: status,
            message: Array.isArray(message) ? message[0] : message, // 如果 message 是数组（例如 class-validator 错误），取第一个
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}