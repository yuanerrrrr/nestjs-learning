# Day 3 - DTO 与 ValidationPipe

## 今日完成
- [x] 理解 DTO 概念，创建 CreateUserDto 和 UpdateUserDto
- [x] 安装 class-validator 和 class-transformer
- [x] 启用全局 ValidationPipe 并配置 whitelist/forbidNonWhitelisted/transform
- [x] 在 Users 模块中实现完整 CRUD（内存存储）
- [x] 测试验证错误返回格式

## 核心概念

### 1. DTO (Data Transfer Object)
- 数据传输对象，用于定义客户端和服务端之间传递的数据结构
- 结合 `class-validator` 可以对传入数据进行验证
- 使用 TypeScript 类而非接口，因为类在运行时保留类型信息

### 2. ValidationPipe
- Nest.js 内置管道，用于自动验证请求数据
- 配合 `class-validator` 装饰器实现声明式验证
- 可全局启用或针对特定路由启用

### 3. 验证装饰器
`class-validator` 提供丰富的验证装饰器：
- `@IsString()`, `@IsInt()`, `@IsEmail()` 等类型验证
- `@MinLength()`, `@MaxLength()`, `@Min()`, `@Max()` 等范围验证
- `@IsOptional()` 标记可选字段

### 4. PartialType
- 来自 `@nestjs/mapped-types`
- 将 DTO 的所有字段转换为可选字段
- 常用于 Update DTO，避免重复定义

## 实现步骤

### 1. 安装依赖
```bash
npm install class-validator class-transformer
npm install @nestjs/mapped-types
```

### 2. 创建 Users 模块
```bash
nest g resource users
# 选择 REST API
# 选择 Yes 生成 CRUD 入口点
```

### 3. 启用全局 ValidationPipe
在 `main.ts` 中配置：
```ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,                // 自动剔除 DTO 中未定义的字段
      forbidNonWhitelisted: true,     // 存在未定义字段时抛出错误
      transform: true,                // 自动将路径参数/查询参数转换为 DTO 定义的类型
    }),
  );
  await app.listen(3000);
}
```

**配置说明：**
- `whitelist: true` - 自动过滤掉 DTO 中未定义的属性
- `forbidNonWhitelisted: true` - 如果请求包含未定义的属性，直接返回 400 错误
- `transform: true` - 自动类型转换（如字符串 "123" → 数字 123）

### 4. 定义 DTO

## 关键代码示例

### CreateUserDto (创建用户 DTO)
```ts
import { IsString, IsEmail, IsOptional, MinLength, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
    @IsString()
    @MinLength(2)
    @Transform(({value}) => value.toLowerCase())
    name: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @MinLength(6)
    password: string;

    @IsInt()
    @Min(14)
    @Max(120)
    age: number;
}
```

### UpdateUserDto (更新用户 DTO)
```ts
import { CreateUserDto } from "./create-user.dto";
import { PartialType } from "@nestjs/mapped-types";

// PartialType 将 CreateUserDto 所有字段设为可选
export class UpdateUserDto extends PartialType(CreateUserDto) {
}
```

### UsersController (控制器)
```ts
import { Controller, Post, Body, Get, Param, Put, Delete, ParseIntPipe } from "@nestjs/common";
import { UserService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UserService) {}

    @Post() 
    create(@Body() createUserDto: CreateUserDto) {
        return this.userService.createUser(createUserDto);
    }

    @Get()
    findAll() {
        return this.userService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.userService.findOne(id);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.update(id, updateUserDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.userService.remove(id);
    }
}
```

### UsersService (服务)
```ts
import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UserService {
    private users: any[] = [];
    private idCounter = 1;

    createUser(createUserDto: CreateUserDto) {
        const newUser = { id: this.idCounter++, ...createUserDto };
        this.users.push(newUser);
        return newUser;
    }

    findAll() {
        return this.users;
    }

    findOne(id: number) {
        const data = this.users.find(user => user.id === id);
        return data;
    }

    update(id: number, updateUserDto: UpdateUserDto) {
        const user = this.findOne(id);
        if (!user) return null;
        Object.assign(user, updateUserDto);
        return user;
    }

    remove(id: number) {
        const index = this.users.findIndex(user => user.id === id);
        if (index === -1) return null;
        this.users.splice(index, 1);
        return true;
    }
}
```

## 常用验证装饰器速查

| 装饰器 | 作用 | 示例 |
|--------|------|------|
| @IsString() | 验证字符串 | `@IsString() name: string` |
| @IsInt() | 验证整数 | `@IsInt() age: number` |
| @IsEmail() | 验证邮箱格式 | `@IsEmail() email: string` |
| @IsOptional() | 标记字段可选 | `@IsOptional() bio?: string` |
| @MinLength(n) | 最小长度 | `@MinLength(6) password: string` |
| @MaxLength(n) | 最大长度 | `@MaxLength(50) title: string` |
| @Min(n) | 最小值 | `@Min(0) price: number` |
| @Max(n) | 最大值 | `@Max(150) age: number` |
| @IsBoolean() | 验证布尔值 | `@IsBoolean() isActive: boolean` |
| @IsDate() | 验证日期 | `@IsDate() birthDate: Date` |
| @IsArray() | 验证数组 | `@IsArray() tags: string[]` |
| @IsEnum(enum) | 验证枚举值 | `@IsEnum(Role) role: Role` |

## 测试接口

### 1. 创建用户 (POST /users)
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "email": "alice@example.com",
    "password": "123456",
    "age": 25
  }'
```

**预期响应：**
```json
{
  "id": 1,
  "name": "alice",
  "email": "alice@example.com",
  "password": "123456",
  "age": 25
}
```

### 2. 查询所有用户 (GET /users)
```bash
curl http://localhost:3000/users
```

### 3. 查询单个用户 (GET /users/:id)
```bash
curl http://localhost:3000/users/1
```

### 4. 更新用户 (PUT /users/:id)
```bash
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob",
    "age": 30
  }'
```

### 5. 删除用户 (DELETE /users/:id)
```bash
curl -X DELETE http://localhost:3000/users/1
```

## 验证错误示例

### 1. 字段类型错误
**请求：**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "age": "not-a-number"
}
```

**响应（400 Bad Request）：**
```json
{
  "message": [
    "age must be an integer number",
    "age must not be less than 14",
    "age must not be greater than 120"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### 2. 邮箱格式错误
**请求：**
```json
{
  "name": "Alice",
  "email": "invalid-email",
  "age": 25
}
```

**响应（400 Bad Request）：**
```json
{
  "message": [
    "email must be an email"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### 3. 包含未定义字段（forbidNonWhitelisted: true）
**请求：**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "age": 25,
  "unknownField": "value"
}
```

**响应（400 Bad Request）：**
```json
{
  "message": [
    "property unknownField should not exist"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

## 关键点总结

1. **DTO 使用类而非接口**：类在运行时保留元数据，验证装饰器才能工作
2. **ValidationPipe 配置建议**：
   - 开发环境：`whitelist: true, forbidNonWhitelisted: true` 便于调试
   - 生产环境：至少启用 `whitelist: true` 防止恶意字段注入
3. **ParseIntPipe**：路径参数默认是字符串，使用 `ParseIntPipe` 自动转换为数字
4. **PartialType 优势**：避免重复定义字段，Update DTO 自动继承所有验证规则
5. **Transform 装饰器**：可在验证前对数据进行转换（如统一转小写）