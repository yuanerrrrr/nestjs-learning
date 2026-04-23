import {Injectable, ExecutionContext, CallHandler, NestInterceptor} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
    code: number;       // 业务状态码，0 表示成功
    message: string;    // 提示信息
    data: T;            // 实际返回数据
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
        return next.handle().pipe(map(data => ({
            code: 0,
            message: 'success',
            data,
        })));
    }
}