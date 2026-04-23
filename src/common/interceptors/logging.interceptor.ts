import { Injectable, CallHandler, ExecutionContext, NestInterceptor, Logger } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingIntercptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingIntercptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> | Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const { ip, method, url } = request;
        const userAgent = request.get('user-agent') || '';
        const now = Date.now();
        this.logger.log(`Request:${method} ${url} - UserAgent: ${userAgent} - IP: ${ip}`);
        
        return next.handle().pipe(
            tap(() => {
                const response = context.switchToHttp().getResponse();
                const { statusCode } = response.statusCode;
                this.logger.log(`Response:${method} ${url} - Status: ${statusCode} - IP: ${ip} took ${Date.now() - now}ms`)
            })
        );
    }
}