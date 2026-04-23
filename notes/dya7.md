# Day 7 - 拦截器 + 异常过滤器 + 统一响应格式 + 分页功能 + 数据库迁移

## 今日完成
- [x] 创建 TransformInterceptor 统一响应格式
- [x] 创建 LoggingInterceptor 记录请求日志
- [x] 创建 HttpExceptionFilter 统一异常处理
- [x] 在 main.ts 中全局注册拦截器和过滤器
- [x] 实现分页功能（PaginationDto + findAndCount）
- [x] 配置数据库使用环境变量（DB_HOST, DB_PORT 等）
- [x] 关闭 synchronize，使用 TypeORM Migration 管理数据库结构
- [x] 创建 data-source.ts 配置文件
- [x] 生成初始迁移文件 InitialSchema
- [x] 执行数据库迁移
- [x] 测试所有接口，验证统一格式和分页生效
- [x] 学习 ExecutionContext 和 CallHandler
- [x] 理解 RxJS 的 pipe、map、tap 操作符

## 完整的执行流程图

```
客户端请求
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
① 中间件 (Middleware)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
② 守卫 (Guards) - AuthGuard('jwt')
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
③ 拦截器前置逻辑 (Interceptor - Before)
   LoggingInterceptor: 记录请求开始时间
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
④ 管道验证 (Pipes) - ValidationPipe
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⑤ 路由处理器 (Controller Method)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⑥ 服务层 (Service)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ↓
    返回数据 (原始格式)
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⑦ 拦截器后置逻辑 (Interceptor - After)
   TransformInterceptor: 包装成统一格式
   LoggingInterceptor: 记录响应时间
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ↓
    返回给客户端 (统一格式)
    {
      code: 0,
      message: 'success',
      data: {...}
    }

如果中间抛出异常:
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
异常过滤器 (Exception Filter)
HttpExceptionFilter: 捕获并格式化错误
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ↓
    返回给客户端 (错误格式)
    {
      code: 404,
      message: 'Task not found',
      timestamp: '2024-01-01T00:00:00.000Z',
      path: '/tasks/999'
    }
```

## 关键代码片段

### 1. TransformInterceptor - 统一响应格式
```ts
// src/common/interceptors/transform.interceptor.ts
import { Injectable, ExecutionContext, CallHandler, NestInterceptor } from '@nestjs/common';
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
    // 使用 RxJS 的 map 操作符转换响应数据
    return next.handle().pipe(
      map(data => ({
        code: 0,
        message: 'success',
        data,
      }))
    );
  }
}
```

**执行效果**:
```ts
// 原始返回：
{ id: 1, title: 'Task 1', status: 'pending' }

// 经过拦截器后：
{
  code: 0,
  message: 'success',
  data: { id: 1, title: 'Task 1', status: 'pending' }
}
```

### 2. LoggingInterceptor - 请求日志记录
```ts
// src/common/interceptors/logging.interceptor.ts
import { Injectable, CallHandler, ExecutionContext, NestInterceptor, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { ip, method, url } = request;
    const userAgent = request.get('user-agent') || '';
    const now = Date.now();

    // 记录请求信息
    this.logger.log(`Request: ${method} ${url} - UserAgent: ${userAgent} - IP: ${ip}`);

    // 使用 tap 操作符在响应完成时记录
    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const elapsed = Date.now() - now;
        this.logger.log(`Response: ${method} ${url} - Status: ${statusCode} - IP: ${ip} - ${elapsed}ms`);
      })
    );
  }
}
```

**执行效果**:
```bash
[LoggingInterceptor] Request: GET /tasks - UserAgent: PostmanRuntime/7.32.3 - IP: ::1
[LoggingInterceptor] Response: GET /tasks - Status: 200 - IP: ::1 - 45ms
```

### 3. HttpExceptionFilter - 统一异常处理
```ts
// src/common/filters/http-exception.filter.ts
import { HttpException, ExceptionFilter, ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';

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
      // 非 HttpException 的异常，打印日志
      this.logger.error(`Unhandled exception: ${exception}`);
    }

    // 统一的错误响应格式
    response.status(status).json({
      code: status,
      message: Array.isArray(message) ? message[0] : message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

**执行效果**:
```ts
// 当抛出异常时：
throw new NotFoundException('Task not found');

// 客户端收到：
{
  code: 404,
  message: 'Task not found',
  timestamp: '2024-01-01T12:00:00.000Z',
  path: '/tasks/999'
}
```

### 4. 全局注册 (main.ts)
```ts
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局注册验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // 自动剥离 DTO 中未定义的属性
    forbidNonWhitelisted: true,  // 如果有未定义的属性则抛出错误
    transform: true,        // 自动类型转换
  }));

  // 全局注册拦截器
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // 全局注册异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3000);
  console.log(`Application is running on: http://localhost:3000`);
}
bootstrap();
```

### 5. 数据库配置与环境变量

#### 5.1 环境变量配置
```bash
# .env
# JWT配置
JWT_SECRET=your-super-secret-key-change-this-in-production

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=lisiyuan04
DB_PASSWORD=123456
DB_DATABASE=nest_demo
```

#### 5.2 AppModule 数据库配置
```ts
// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,           // 全局可用
      envFilePath: '.env',      // 环境变量文件路径
    }),
    
    // 使用 forRootAsync 异步配置数据库
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: false,      // 关闭自动同步，使用迁移管理
        logging: true,           // 打印 SQL 日志，方便调试
      }),
      inject: [ConfigService],
    }),
    // ... 其他模块
  ],
})
export class AppModule {}
```

**关键变化**:
- `synchronize: false`: 关闭自动同步表结构（生产环境必须）
- 使用 `ConfigService` 从环境变量读取配置
- `logging: true`: 开启 SQL 日志

### 6. TypeORM Migration 数据库迁移

#### 6.1 为什么要用 Migration？

**问题**: `synchronize: true` 的风险
```ts
// ❌ 开发时方便，但生产环境很危险
synchronize: true  // 每次启动自动同步表结构
```

**风险**:
- 可能会**删除列**或**删除表**
- 数据丢失，无法回滚
- 多实例部署时可能冲突
- 无法追踪数据库变更历史

**解决方案**: 使用 Migration
```ts
// ✅ 安全可控的数据库变更管理
synchronize: false
migrations: ['src/database/migrations/*.ts']
```

#### 6.2 创建 DataSource 配置文件
```ts
// data-source.ts (项目根目录)
import { DataSource } from "typeorm";
import { User } from "src/users/users.entity";
import { Task } from "src/tasks/task.entity";
import { config } from "dotenv";

config(); // 加载环境变量

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, Task],                          // 所有实体
  synchronize: false,                              // 关闭自动同步
  migrations: ['src/database/migrations/*.ts'],   // 迁移文件目录
  logging: true,
});
```

**关键点**:
- 使用 `config()` 加载 `.env` 文件
- `entities` 必须明确列出所有实体（不能用通配符）
- `migrations` 指定迁移文件路径

#### 6.3 配置 npm 脚本
```json
// package.json
{
  "scripts": {
    "typeorm": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js -d ./data-source.ts",
    "migration:generate": "npm run typeorm -- migration:generate",
    "migration:run": "npm run typeorm -- migration:run",
    "migration:revert": "npm run typeorm -- migration:revert"
  }
}
```

#### 6.4 生成迁移文件
```bash
# 根据实体变化自动生成迁移文件
npm run migration:generate src/database/migrations/InitialSchema
```

**生成的迁移文件**:
```ts
// src/database/migrations/1776871011964-InitialSchema.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1776871011964 implements MigrationInterface {
  name = 'InitialSchema1776871011964'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建 tasks 表
    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" SERIAL NOT NULL,
        "title" character varying(200) NOT NULL,
        "description" text,
        "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'pending',
        "dueDate" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" integer,
        CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id")
      )
    `);

    // 创建 users 表
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "name" character varying(100) NOT NULL,
        "age" integer NOT NULL DEFAULT '0',
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);

    // 添加外键约束
    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "FK_166bd96559cb38595d392f75a35"
      FOREIGN KEY ("userId")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚操作：删除外键和表
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_166bd96559cb38595d392f75a35"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
  }
}
```

**迁移文件结构**:
- `up()`: 执行迁移（创建表、添加列等）
- `down()`: 回滚迁移（撤销 up 的操作）
- TypeORM 自动生成所有 SQL 语句

#### 6.5 执行迁移
```bash
# 执行所有未执行的迁移
npm run migration:run

# 输出示例：
# query: SELECT * FROM "migrations" "migrations"
# query: CREATE TABLE "tasks" ...
# query: CREATE TABLE "users" ...
# query: ALTER TABLE "tasks" ADD CONSTRAINT ...
# Migration InitialSchema1776871011964 has been executed successfully.
```

#### 6.6 回滚迁移
```bash
# 回滚最后一次迁移
npm run migration:revert

# 输出示例：
# query: ALTER TABLE "tasks" DROP CONSTRAINT "FK_166bd96559cb38595d392f75a35"
# query: DROP TABLE "users"
# query: DROP TABLE "tasks"
# Migration InitialSchema1776871011964 has been reverted successfully.
```

### 7. Service 中抛出异常
```ts
// src/tasks/tasks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class TasksService {
  async findOneByUser(userId: number, taskId: number): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: {
        id: taskId,
        user: { id: userId },
      },
      relations: ['user'],
    });

    // 如果任务不存在或不属于该用户，抛出 404 异常
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    return task;
  }

  async updateByUser(userId: number, taskId: number, updateTaskDto: UpdateTaskDto): Promise<Task> {
    // 先验证任务存在且属于该用户（会自动抛出 NotFoundException）
    await this.findOneByUser(userId, taskId);
    
    await this.tasksRepository.update(taskId, updateTaskDto);
    return await this.findOneByUser(userId, taskId);
  }
}
```

### 8. 分页功能实现

#### 8.1 PaginationDto - 分页参数验证
```ts
// src/tasks/dto/pagination.dto.ts
import { IsOptional, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)        // 自动转换字符串为数字
  @IsPositive()              // 必须是正数
  page: number = 1;          // 默认第 1 页

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)                    // 最小值为 1
  limit: number = 10;        // 默认每页 10 条
}
```

**关键装饰器**:
- `@Type(() => Number)`: 自动将查询参数从字符串转换为数字
- `@IsPositive()`: 验证值必须为正数
- `@Min(1)`: 设置最小值限制
- 默认值: `page = 1`, `limit = 10`

#### 8.2 TasksService - 分页查询逻辑
```ts
// src/tasks/tasks.service.ts
async findAllByUser(userId: number, page: number = 1, limit: number = 10): Promise<{
  items: Task[];
  total: number;
  page: number;
  limit: number;
}> {
  // findAndCount 返回 [数据数组, 总数]
  const [items, total] = await this.tasksRepository.findAndCount({
    where: {
      user: { id: userId },
    },
    order: {
      created_at: 'DESC',
    },
    skip: (page - 1) * limit,    // 跳过前面的记录
    take: limit,                  // 获取指定数量
  });

  return {
    items,                         // 当前页数据
    total,                         // 总记录数
    page,                          // 当前页码
    limit,                         // 每页条数
  };
}
```

**分页公式**:
- `skip = (page - 1) * limit`: 跳过的记录数
  - 第 1 页: `(1 - 1) * 10 = 0` (从第 0 条开始)
  - 第 2 页: `(2 - 1) * 10 = 10` (跳过前 10 条)
  - 第 3 页: `(3 - 1) * 10 = 20` (跳过前 20 条)
- `take = limit`: 获取的记录数

**返回数据结构**:
```ts
{
  items: Task[],      // 当前页的任务列表
  total: number,      // 总任务数
  page: number,       // 当前页码
  limit: number       // 每页条数
}
```

#### 8.3 TasksController - 接收分页参数
```ts
// src/tasks/tasks.controller.ts
@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TasksController {
  @Get()
  findAll(@Request() req, @Query() paginationDto: PaginationDto) {
    return this.tasksService.findAllByUser(
      req.user.userId,
      paginationDto.page,
      paginationDto.limit,
    );
  }
}
```

**关键点**:
- `@Query()`: 自动从 URL 查询参数绑定到 DTO
- `ValidationPipe`: 自动验证 DTO（需在 main.ts 全局启用）
- `@Type(() => Number)`: 自动将字符串 `"1"` 转换为数字 `1`

## 核心概念

### 拦截器 (Interceptors)
**作用**: 在方法执行前后添加额外逻辑

**常见用途**:
- 转换响应数据（统一格式）
- 记录请求/响应日志
- 性能监控（计算耗时）
- 缓存响应结果
- 修改请求/响应流

**关键接口**:
```ts
interface NestInterceptor<T, R> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<R>;
}
```

- `ExecutionContext`: 当前执行上下文，可获取请求、响应对象
- `CallHandler`: 调用 `handle()` 继续执行，返回 `Observable<T>`
- `Observable`: RxJS 可观察对象，可使用 `pipe` 链式处理

**执行顺序**:
```
请求 → [拦截器1 前] → [拦截器2 前] → 路由处理器 → [拦截器2 后] → [拦截器1 后] → 响应
```

### 异常过滤器 (Exception Filters)
**作用**: 捕获并处理应用中抛出的异常

**常见用途**:
- 统一错误响应格式
- 记录错误日志
- 根据不同异常返回不同状态码
- 隐藏敏感错误信息

**关键接口**:
```ts
interface ExceptionFilter<T = any> {
  catch(exception: T, host: ArgumentsHost): any;
}
```

- `@Catch(HttpException)`: 指定捕获的异常类型
- `ArgumentsHost`: 当前应用上下文，可切换到 HTTP、RPC、WebSocket

**常见的 HTTP 异常**:
```ts
new BadRequestException('Invalid input');        // 400
new UnauthorizedException('Invalid token');      // 401
new ForbiddenException('Access denied');         // 403
new NotFoundException('Resource not found');     // 404
new ConflictException('Email already exists');   // 409
new InternalServerErrorException('Server error'); // 500
```

### RxJS 操作符
**map**: 转换数据流
```ts
return next.handle().pipe(
  map(data => ({ code: 0, data }))
);
```

**tap**: 执行副作用，不修改数据
```ts
return next.handle().pipe(
  tap(() => console.log('Request completed'))
);
```

**catchError**: 捕获错误
```ts
return next.handle().pipe(
  catchError(err => throwError(() => new Error('Custom error')))
);
```

## NestJS 请求生命周期

完整的请求处理顺序：

```
1. Incoming request (客户端请求)
    ↓
2. Middleware (中间件)
    ↓
3. Guards (守卫)
    ↓
4. Interceptors (拦截器 - 前置)
    ↓
5. Pipes (管道)
    ↓
6. Route handler (路由处理器)
    ↓
7. Service (服务层)
    ↓
8. Interceptors (拦截器 - 后置)
    ↓
9. Exception filters (异常过滤器，如果有异常)
    ↓
10. Outgoing response (返回响应)
```

## 测试接口

### 1. 成功响应 - 获取任务列表（分页）
```bash
GET http://localhost:3000/tasks?page=1&limit=10
Authorization: Bearer <your_jwt_token>
```

**响应** (经过 TransformInterceptor 包装):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "title": "完成项目文档",
        "status": "pending",
        "created_at": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": 2,
        "title": "代码评审",
        "status": "in_progress",
        "created_at": "2024-01-02T00:00:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

**分页信息说明**:
- `items`: 当前页的数据（10 条）
- `total`: 总共 25 条记录
- `page`: 当前是第 1 页
- `limit`: 每页显示 10 条
- **总页数**: `Math.ceil(total / limit) = Math.ceil(25 / 10) = 3` 页

**其他分页请求示例**:
```bash
# 获取第 2 页，每页 10 条
GET http://localhost:3000/tasks?page=2&limit=10

# 获取第 1 页，每页 20 条
GET http://localhost:3000/tasks?page=1&limit=20

# 不传参数，使用默认值（page=1, limit=10）
GET http://localhost:3000/tasks
```

**控制台日志** (LoggingInterceptor):
```bash
[LoggingInterceptor] Request: GET /tasks?page=1&limit=10 - UserAgent: PostmanRuntime/7.32.3 - IP: ::1
[LoggingInterceptor] Response: GET /tasks?page=1&limit=10 - Status: 200 - IP: ::1 - 32ms
```

### 2. 异常响应 - 任务不存在
```bash
GET http://localhost:3000/tasks/999
Authorization: Bearer <your_jwt_token>
```

**响应** (经过 HttpExceptionFilter 处理):
```json
{
  "code": 404,
  "message": "Task with ID 999 not found",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/tasks/999"
}
```

### 3. 验证失败 - 缺少必填字段
```bash
POST http://localhost:3000/tasks
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "description": "只有描述，没有标题"
}
```

**响应** (ValidationPipe + HttpExceptionFilter):
```json
{
  "code": 400,
  "message": "title should not be empty",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/tasks"
}
```

### 4. 未授权 - 无效 Token
```bash
GET http://localhost:3000/tasks
Authorization: Bearer invalid_token
```

**响应**:
```json
{
  "code": 401,
  "message": "Unauthorized",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/tasks"
}
```

### 5. 分页参数验证失败
```bash
GET http://localhost:3000/tasks?page=0&limit=-5
Authorization: Bearer <your_jwt_token>
```

**响应** (ValidationPipe + HttpExceptionFilter):
```json
{
  "code": 400,
  "message": "page must be a positive number",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/tasks"
}
```

## 学到的知识点

1. **拦截器 (Interceptors)**:
   - 使用 `@Injectable()` 和 `implements NestInterceptor`
   - 通过 `next.handle()` 继续执行请求
   - 使用 RxJS 的 `pipe` 和操作符处理响应流
   - `map` 用于转换数据，`tap` 用于执行副作用

2. **异常过滤器 (Exception Filters)**:
   - 使用 `@Catch(HttpException)` 指定捕获的异常类型
   - 通过 `ArgumentsHost` 获取请求上下文
   - 统一错误响应格式，提升 API 一致性

3. **ExecutionContext**:
   - `switchToHttp()`: 切换到 HTTP 上下文
   - `getRequest()`: 获取 Express Request 对象
   - `getResponse()`: 获取 Express Response 对象

4. **全局注册**:
   - `app.useGlobalInterceptors()`: 注册全局拦截器
   - `app.useGlobalFilters()`: 注册全局异常过滤器
   - `app.useGlobalPipes()`: 注册全局管道

5. **RxJS 基础**:
   - `Observable`: 可观察的数据流
   - `pipe()`: 链式调用操作符
   - `map()`: 转换数据
   - `tap()`: 执行副作用（如日志）

6. **分页功能**:
   - `findAndCount()`: 同时返回数据和总数 `[items, total]`
   - `skip`: 跳过指定数量的记录
   - `take`: 获取指定数量的记录
   - 分页公式: `skip = (page - 1) * limit`

7. **DTO 自动转换**:
   - `@Type(() => Number)`: 自动将字符串转换为数字
   - `@IsPositive()`: 验证必须为正数
   - `@Min(1)`: 设置最小值
   - `transform: true`: 在 ValidationPipe 中启用类型转换

8. **TypeORM Migration（数据库迁移）**:
   - `synchronize: false`: 关闭自动同步，使用迁移管理
   - `migration:generate`: 根据实体变化自动生成迁移文件
   - `migration:run`: 执行未执行的迁移
   - `migration:revert`: 回滚最后一次迁移
   - `up()` 和 `down()`: 定义正向和回滚操作

9. **DataSource 配置**:
   - 独立的 `data-source.ts` 文件用于 CLI 操作
   - 使用 `config()` 加载环境变量
   - `entities` 数组必须明确列出所有实体
   - 支持迁移版本控制和团队协作

## 注意事项

1. **拦截器执行顺序**:
   - 多个拦截器的执行顺序是先注册先执行（前置逻辑）
   - 后置逻辑则是后注册先执行（类似洋葱模型）

2. **异常过滤器的范围**:
   - `@Catch()` 不传参数会捕获所有异常
   - `@Catch(HttpException)` 只捕获 HTTP 异常
   - 可以创建多个过滤器处理不同类型的异常

3. **避免双重包装**:
   - 如果使用了 TransformInterceptor，Service 层直接返回数据即可
   - 不要在 Controller 中再次包装 `{ code: 0, data }`

4. **日志级别**:
   - Logger 支持 `log`, `error`, `warn`, `debug`, `verbose`
   - 生产环境建议使用专业日志库（如 winston, pino）

5. **性能考虑**:
   - LoggingInterceptor 会记录所有请求，确保日志输出高效
   - 避免在拦截器中执行耗时操作

6. **分页注意事项**:
   - 默认值设置在 DTO 中（`page = 1`, `limit = 10`）
   - 考虑设置 `limit` 的最大值，防止一次性查询过多数据
   - 大数据量时考虑使用游标分页（cursor-based pagination）
   - `findAndCount` 会执行两次查询（一次获取数据，一次计数），可优化

7. **ValidationPipe 配置**:
   - `transform: true`: 启用自动类型转换（必须）
   - `whitelist: true`: 自动剥离未定义的属性
   - `forbidNonWhitelisted: true`: 如果有未定义属性则抛出错误

8. **数据库迁移注意事项**:
   - **永远不要在生产环境使用 `synchronize: true`**
   - 迁移文件应纳入版本控制（Git）
   - 在团队开发中，迁移文件按顺序执行，避免冲突
   - 测试迁移的 `up()` 和 `down()` 都能正常工作
   - 重要变更前先备份数据库
   - `migration:generate` 会比对实体和数据库差异自动生成 SQL

9. **环境变量安全**:
   - `.env` 文件不要提交到代码仓库（添加到 `.gitignore`）
   - 生产环境使用环境变量或密钥管理服务
   - 敏感信息（JWT_SECRET, DB_PASSWORD）必须保密

## 下一步

- [ ] 实现自定义装饰器（如 `@CurrentUser()`）
- [ ] 添加角色权限控制（RBAC）
- [ ] 集成 Swagger API 文档
- [ ] 实现高级查询功能（排序、搜索、过滤）
- [ ] 优化分页性能（游标分页）
- [ ] 添加单元测试和 E2E 测试

## 分页功能总结

### TypeORM 分页方法对比

| 方法 | 返回值 | 用途 | 性能 |
|------|--------|------|------|
| `find()` | `Task[]` | 普通查询 | ⭐⭐⭐ |
| `findAndCount()` | `[Task[], number]` | 分页查询（需要总数） | ⭐⭐ |
| `createQueryBuilder()` | 自定义 | 复杂查询、性能优化 | ⭐⭐⭐⭐ |

### 优化建议

**1. 设置 limit 最大值**
```ts
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Max(100)  // 最大每页 100 条
  limit: number = 10;
}
```

**2. 使用 QueryBuilder 优化大数据量查询**
```ts
async findAllByUser(userId: number, page: number, limit: number) {
  const query = this.tasksRepository
    .createQueryBuilder('task')
    .where('task.userId = :userId', { userId })
    .orderBy('task.created_at', 'DESC')
    .skip((page - 1) * limit)
    .take(limit);

  const [items, total] = await query.getManyAndCount();
  
  return { items, total, page, limit };
}
```

**3. 游标分页（适合实时数据流）**
```ts
// 基于 ID 的游标分页
async findAllByCursor(userId: number, cursor?: number, limit: number = 10) {
  const query = this.tasksRepository
    .createQueryBuilder('task')
    .where('task.userId = :userId', { userId });

  if (cursor) {
    query.andWhere('task.id < :cursor', { cursor });
  }

  const items = await query
    .orderBy('task.id', 'DESC')
    .take(limit)
    .getMany();

  const nextCursor = items.length === limit ? items[items.length - 1].id : null;

  return { items, nextCursor, hasMore: items.length === limit };
}
```

## TypeORM Migration 工作流程

### 完整的迁移流程

```
┌─────────────────────────────────────────────────────────┐
│  1. 修改实体文件 (Entity)                                  │
│     - 添加新字段                                           │
│     - 修改字段类型                                         │
│     - 添加关系                                            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  2. 生成迁移文件                                          │
│     npm run migration:generate src/database/migrations/XXX│
│                                                          │
│     TypeORM 会：                                          │
│     - 比对实体定义和数据库当前结构                           │
│     - 自动生成 SQL 语句                                    │
│     - 创建 up() 和 down() 方法                             │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  3. 检查迁移文件                                          │
│     - 查看生成的 SQL 是否正确                              │
│     - 确保 down() 方法能正确回滚                           │
│     - 添加数据迁移逻辑（如果需要）                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  4. 提交到版本控制                                        │
│     git add src/database/migrations/XXX.ts               │
│     git commit -m "feat: add XXX migration"              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  5. 执行迁移                                             │
│     npm run migration:run                                │
│                                                          │
│     数据库变更记录保存在 migrations 表：                    │
│     | id | timestamp     | name                    |      │
│     | 1  | 1776871011964 | InitialSchema1776871011964 |   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  6. 测试验证                                             │
│     - 启动应用，测试新功能                                 │
│     - 如果有问题，执行回滚：npm run migration:revert       │
└─────────────────────────────────────────────────────────┘
```

### 常见迁移场景

#### 场景 1: 添加新字段
```ts
// 1. 修改实体
@Entity()
export class Task {
  // ... 其他字段
  
  @Column({ type: 'int', default: 0 })  // 新增字段
  priority: number;
}

// 2. 生成迁移
// npm run migration:generate src/database/migrations/AddTaskPriority

// 3. 生成的迁移文件
export class AddTaskPriority1776871011965 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD "priority" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tasks"
      DROP COLUMN "priority"
    `);
  }
}
```

#### 场景 2: 修改字段类型
```ts
// 1. 修改实体
@Column({ length: 500 })  // 从 200 改为 500
title: string;

// 2. 生成迁移会包含 ALTER TABLE 语句
ALTER TABLE "tasks" ALTER COLUMN "title" TYPE character varying(500);
```

#### 场景 3: 数据迁移
```ts
// 有时需要手动修改迁移文件来处理数据
export class MigrateTaskStatus1776871011966 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 添加新列
    await queryRunner.query(`ALTER TABLE "tasks" ADD "new_status" VARCHAR(50)`);
    
    // 2. 迁移数据
    await queryRunner.query(`
      UPDATE "tasks"
      SET "new_status" = CASE
        WHEN "old_status" = 0 THEN 'pending'
        WHEN "old_status" = 1 THEN 'in_progress'
        WHEN "old_status" = 2 THEN 'completed'
        ELSE 'pending'
      END
    `);
    
    // 3. 删除旧列
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "old_status"`);
    
    // 4. 重命名新列
    await queryRunner.query(`ALTER TABLE "tasks" RENAME COLUMN "new_status" TO "status"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚操作（反向执行）
    await queryRunner.query(`ALTER TABLE "tasks" RENAME COLUMN "status" TO "new_status"`);
    await queryRunner.query(`ALTER TABLE "tasks" ADD "old_status" INTEGER`);
    await queryRunner.query(`
      UPDATE "tasks"
      SET "old_status" = CASE
        WHEN "new_status" = 'pending' THEN 0
        WHEN "new_status" = 'in_progress' THEN 1
        WHEN "new_status" = 'completed' THEN 2
        ELSE 0
      END
    `);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "new_status"`);
  }
}
```

### Migration 命令速查

| 命令 | 说明 |
|------|------|
| `npm run migration:generate src/database/migrations/XXX` | 根据实体变化生成迁移文件 |
| `npm run migration:run` | 执行所有未执行的迁移 |
| `npm run migration:revert` | 回滚最后一次迁移 |
| `npm run typeorm migration:show` | 显示所有迁移及其状态 |
| `npm run typeorm migration:create src/database/migrations/XXX` | 手动创建空白迁移文件 |

### 最佳实践

1. **每次迁移只做一件事**: 一个迁移文件只负责一个逻辑变更
2. **测试回滚**: 每次迁移后都测试 `migration:revert`
3. **团队协作**: 合并代码前先 `migration:run`，避免冲突
4. **生产环境**: 部署前先在测试环境执行迁移
5. **备份数据**: 执行重要迁移前备份数据库
6. **命名规范**: 使用描述性名称，如 `AddUserRole`, `UpdateTaskStatus`