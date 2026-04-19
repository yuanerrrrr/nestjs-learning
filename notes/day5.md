# Day 5 - 密码加密与 JWT 认证

## 今日完成
- [x] 安装 bcrypt、@nestjs/jwt、@nestjs/passport、passport、passport-jwt
- [x] 修改用户注册：密码哈希存储
- [x] 创建 AuthModule、AuthService、AuthController
- [x] 实现 validateUser（邮箱+密码验证）和 login（生成 token）
- [x] 实现 JwtStrategy，从 Authorization header 提取 token
- [x] 添加受保护路由 `/users/profile`，使用 @UseGuards(AuthGuard('jwt'))
- [x] 测试登录获取 token，并成功访问受保护接口

## 安装依赖
```bash
npm install bcrypt @nestjs/jwt @nestjs/passport passport passport-jwt
npm install --save-dev @types/bcrypt @types/passport-jwt
```

## 完整的认证流程图
┌─────────────────────────────────────────────────────────────┐
│                    第一阶段：登录                              │
└─────────────────────────────────────────────────────────────┘

客户端
  ↓
POST /auth/login
{
  "email": "user@example.com",
  "password": "123456"          ← 明文密码
}
  ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AuthController.login()
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ↓
authService.validateUser(email, password)
  ↓
┌─────────────────────────────────────────┐
│ ① 根据邮箱从数据库查找用户                 │
│    const user = await findByEmail(email) │
│                                          │
│ ② 比对密码哈希                            │
│    bcrypt.compare(password, user.password)│
│                                          │
│ ③ 验证失败                                │
│    ├─ 用户不存在 → 401 ❌                 │
│    └─ 密码错误 → 401 ❌                   │
│                                          │
│ ④ 验证成功                                │
│    return {id, email, name} ✅            │
└─────────────────────────────────────────┘
  ↓
authService.login(user)
  ↓
生成 JWT token
  payload = {sub: user.id, email: user.email}
  token = jwtService.sign(payload)
  ↓
返回给客户端
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
  ↓
客户端保存 token（localStorage/sessionStorage）


┌─────────────────────────────────────────────────────────────┐
│              第二阶段：访问受保护资源                           │
│           （后续的每一次请求都经历这个阶段）                     │
└─────────────────────────────────────────────────────────────┘

客户端
  ↓
GET /users/profile
Authorization: Bearer eyJhbGci...  ← JWT token（不是密码！）
  ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@UseGuards(AuthGuard('jwt'))
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ↓
JwtStrategy 验证
  ↓
┌─────────────────────────────────────────┐
│ ① 从 Header 提取 token                   │
│    Authorization: Bearer <token>        │
│                                          │
│ ② 验证 token 签名                        │
│    使用 secretOrKey 验证是否被篡改        │
│                                          │
│ ③ 验证 token 是否过期                    │
│    检查 exp 字段                         │
│                                          │
│ ④ 验证失败                                │
│    ├─ 签名无效 → 401 ❌                   │
│    ├─ token 过期 → 401 ❌                 │
│    └─ token 格式错误 → 401 ❌             │
│                                          │
│ ⑤ 验证成功                                │
│    解析 payload                          │
│    调用 validate(payload)                │
│    return {userId, email} ✅              │
└─────────────────────────────────────────┘
  ↓
执行 getProfile(req)
  req.user = {userId: 1, email: "user@example.com"}
  ↓
返回响应

## 关键代码片段

### 1. 密码哈希（users.service.ts）
在用户注册时对密码进行哈希处理：
```ts
async createUser(createUserDto: CreateUserDto): Promise<User> {
    // 生成盐（salt rounds = 10 是常用值）
    const salt = await bcrypt.genSalt(10);
    // 哈希密码
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
    const user = this.usersRepository.create({
        ...createUserDto,
        password: hashedPassword,
    });
    return this.usersRepository.save(user);
}

// 根据邮箱查找用户（用于登录验证）
async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({email});
}
```

### 2. Auth 模块配置（auth.module.ts）
配置 JWT 和 Passport：
```ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule,                      // 导入 UsersModule 以便使用 UsersService
    PassportModule,
    JwtModule.register({
      global: true,
      secret: 'your-secret-key',      // 生产环境应使用环境变量
      signOptions: {expiresIn: '1d'}, // token 有效期 1 天
    })
  ],
  providers: [AuthService, JwtStrategy], // 注册守卫和策略
  controllers: [AuthController]
})
export class AuthModule {}
```

### 3. Auth 服务（auth.service.ts）
实现用户验证和 token 生成：
```ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ) {}

    // 验证用户：根据邮箱查找用户，并比对密码
    async validateUser(email: string, password: string) {
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentails');
        }
        // 返回用户信息，排除密码
        const {password: _, ...result} = user;
        return result;
    }

    // 登录：生成 JWT token
    login(user: any) {
        const payload = {sub: user.id, email: user.email};
        return {
            access_token: this.jwtService.sign(payload),
        }
    }
}
```

### 4. Auth 控制器（auth.controller.ts）
提供登录接口：
```ts
import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
    ) {}

    @Post('login')
    async login(@Body() body: {email: string, password: string}) {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) {
            throw new UnauthorizedException();
        }
        return this.authService.login(user);
    }
}
```

### 5. JWT 策略（jwt.strategy.ts）
定义如何验证和解析 JWT token：
```ts
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: 'your-secret-key', // 必须与 JwtModule 注册时的 secret 一致
        });
    }

    async validate(payload: any) {
        // payload 包含 JWT 中存储的信息（sub, email 等）
        // 返回的对象会附加到 Request 对象上（req.user）
        return {userId: payload.sub, email: payload.email};
    }
}
```

### 6. 受保护的路由（users.controller.ts）
使用 `@UseGuards(AuthGuard('jwt'))` 保护路由：
```ts
import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Controller('users')
export class UsersController {
    @UseGuards(AuthGuard('jwt')) // 手动在需要认证的接口上加路由保护
    @Get('profile')
    getProfile(@Request() req) {
        // req.user 就是在 JwtStrategy.validate 中返回的对象
        return req.user;
    }
}
```

## 测试流程

### 1. 注册用户
```bash
POST http://localhost:3000/users
Content-Type: application/json

{
  "name": "张三",
  "email": "zhangsan@example.com",
  "password": "123456"
}
```
密码会被自动哈希后存储到数据库。

### 2. 登录获取 token
```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "zhangsan@example.com",
  "password": "123456"
}
```
返回结果：
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. 访问受保护的接口
```bash
GET http://localhost:3000/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
返回结果：
```json
{
  "userId": 1,
  "email": "zhangsan@example.com"
}
```

如果不带 token 或 token 无效，将返回 401 Unauthorized。

## 核心概念

### bcrypt 密码加密
- **genSalt()**：生成盐值，用于增加哈希的随机性
- **hash()**：对密码进行哈希处理
- **compare()**：验证明文密码与哈希密码是否匹配
- 密码永远不应该以明文形式存储

### JWT (JSON Web Token)
- **Payload**：存储用户信息（sub: userId, email 等）
- **Secret**：用于签名和验证 token 的密钥（生产环境应使用环境变量）
- **ExpiresIn**：token 的有效期（本例为 1 天）
- token 格式：`Bearer <token>`

### Passport 策略
- **JwtStrategy**：定义如何从请求中提取和验证 token
- **validate()**：验证成功后返回的数据会附加到 `req.user`
- **AuthGuard('jwt')**：守卫装饰器，用于保护需要认证的路由

## 注意事项

1. **生产环境安全**：
   - JWT secret 应存储在环境变量中，不要硬编码
   - 考虑使用更短的 token 有效期并实现刷新 token 机制
   
2. **密码策略**：
   - salt rounds 为 10 是平衡安全性和性能的常用值
   - 可根据需要调整（值越高越安全，但也越慢）

3. **错误处理**：
   - 登录失败时不要暴露具体原因（是邮箱不存在还是密码错误）
   - 统一返回 "Invalid credentials" 以防止用户枚举攻击