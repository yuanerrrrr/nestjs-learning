# Day 4 - 数据库集成：PostgreSQL (Homebrew) + TypeORM

## 今日完成
- [x] 安装 Homebrew（如未安装）
- [x] 使用 brew install postgresql 安装 PostgreSQL
- [x] 启动服务：brew services start postgresql
- [x] 创建数据库：createdb nest_demo
- [x] 安装 @nestjs/typeorm, typeorm, pg
- [x] 配置 TypeORM 连接（host: localhost, 无密码）
- [x] 定义 User 实体，自动创建 users 表
- [x] 改造 UsersService 使用 Repository
- [x] 测试 CRUD，数据持久化成功
- [x] 安装 TablePlus/DBeaver 查看数据

## 核心概念

### 1. TypeORM
- TypeScript 编写的 ORM（对象关系映射）框架
- 支持 PostgreSQL、MySQL、SQLite 等多种数据库
- 通过装饰器定义实体（Entity），自动映射为数据库表
- 提供 Repository 模式进行数据库操作

### 2. Entity（实体）
- 使用 `@Entity()` 装饰器标记的 TypeScript 类
- 类的属性对应数据库表的字段
- 通过装饰器定义字段类型、约束、默认值等

### 3. Repository（仓库）
- TypeORM 提供的数据访问层抽象
- 封装了常用的 CRUD 操作方法
- 支持复杂查询构建（QueryBuilder）

### 4. synchronize（同步模式）
- 开发环境特性，自动根据实体定义同步数据库结构
- 生产环境应使用 Migration（数据迁移）
- 会自动创建表、添加字段、修改字段类型等

## 实现步骤

### 1. 安装 PostgreSQL（macOS Homebrew）
```bash
# 安装 Homebrew（如果未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 PostgreSQL
brew install postgresql

# 启动 PostgreSQL 服务
brew services start postgresql

# 查看服务状态
brew services list

# 创建数据库
createdb nest_demo

# 测试连接（可选）
psql nest_demo
# \l 查看所有数据库
# \dt 查看所有表
# \q 退出
```

### 2. 安装依赖
```bash
npm install @nestjs/typeorm typeorm pg
```

**依赖说明：**
- `@nestjs/typeorm` - Nest.js 的 TypeORM 集成模块
- `typeorm` - TypeORM 核心库
- `pg` - PostgreSQL 驱动

### 3. 配置 TypeORM 连接
在 `app.module.ts` 中配置 TypeORM：

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'lisiyuan04',  // 或 process.env.USER
      password: '',            // Homebrew 安装的 PostgreSQL 默认无密码
      database: 'nest_demo',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      autoLoadEntities: true,
      synchronize: true,       // 开发环境自动同步表结构
      logging: true,           // 打印 SQL 日志，方便调试
    }),
    UsersModule,
  ],
})
export class AppModule {}
```

**配置说明：**
- `type` - 数据库类型（postgres/mysql/sqlite 等）
- `host` - 数据库主机地址
- `port` - 数据库端口（PostgreSQL 默认 5432）
- `username` - 数据库用户名（Homebrew 版本默认是当前系统用户）
- `password` - 数据库密码（Homebrew 版本默认为空）
- `database` - 数据库名称
- `entities` - 实体文件路径
- `autoLoadEntities` - 自动加载模块中注册的实体
- `synchronize` - 自动同步实体到数据库（**仅用于开发环境**）
- `logging` - 打印 SQL 语句（便于调试）

### 4. 定义实体（Entity）
创建 `src/users/users.entity.ts`：

```ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn 
} from "typeorm";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Column({ type: 'int', default: 0 })
    age: number;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;
}
```

**装饰器说明：**
- `@Entity('users')` - 定义实体，对应数据库表名 `users`
- `@PrimaryGeneratedColumn()` - 主键，自动递增
- `@Column()` - 普通字段
  - `length` - 字符串最大长度
  - `type` - 字段类型
  - `default` - 默认值
  - `unique` - 唯一约束
- `@CreateDateColumn()` - 创建时间，自动设置
- `@UpdateDateColumn()` - 更新时间，自动更新
- `name` - 数据库字段名（默认使用属性名）

### 5. 在模块中注册实体
修改 `src/users/users.module.ts`：

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UserService } from './users.service';
import { User } from './users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],  // 注册实体
  controllers: [UsersController],
  providers: [UserService],
})
export class UsersModule {}
```

**关键点：**
- `TypeOrmModule.forFeature([User])` - 注册 User 实体到当前模块
- 注册后，模块内可以注入 `Repository<User>` 进行数据库操作

### 6. 改造 Service 使用 Repository
修改 `src/users/users.service.ts`：

```ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./users.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {}

    createUser(createUserDto: CreateUserDto): Promise<User> {
        const user = this.usersRepository.create(createUserDto);
        return this.usersRepository.save(user);
    }

    findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async findOne(id: number): Promise<User> {
        const data = await this.usersRepository.findOneBy({ id });
        if (!data) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return data;
    }

    async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
        const result = await this.usersRepository.update(id, updateUserDto);
        if (result.affected === 0) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        const deleteResult = await this.usersRepository.delete(id);
        if (deleteResult.affected === 0) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
    }
}
```

**关键变化：**
- 使用 `@InjectRepository(User)` 注入 Repository
- 从内存数组存储改为数据库持久化
- 所有方法返回 `Promise`（数据库操作是异步的）
- 使用 `NotFoundException` 处理记录不存在的情况

## Repository 常用方法

| 方法 | 说明 | 示例 |
|------|------|------|
| `create(data)` | 创建实体实例（不保存） | `const user = repo.create({ name: 'Alice' })` |
| `save(entity)` | 保存实体到数据库 | `await repo.save(user)` |
| `find()` | 查询所有记录 | `await repo.find()` |
| `findOne(options)` | 查询单条记录 | `await repo.findOne({ where: { id: 1 } })` |
| `findOneBy(where)` | 简化的单条查询 | `await repo.findOneBy({ id: 1 })` |
| `update(id, data)` | 更新记录 | `await repo.update(1, { name: 'Bob' })` |
| `delete(id)` | 删除记录 | `await repo.delete(1)` |
| `count()` | 统计记录数 | `await repo.count()` |
| `createQueryBuilder()` | 复杂查询构建器 | `await repo.createQueryBuilder('user').where('user.age > :age', { age: 18 })` |

## 测试接口

### 1. 启动应用
```bash
npm run start:dev
```

**预期日志：**
```
[Nest] 12345  - 2024/04/14 10:00:00     LOG [TypeOrmModule] Mapped {User} entity
[Nest] 12345  - 2024/04/14 10:00:00     LOG [TypeOrmModule] TypeOrmModule dependencies initialized
query: SELECT * FROM "information_schema"."tables" WHERE "table_schema" = 'public' AND "table_name" = 'users'
query: CREATE TABLE "users" (...)
[Nest] 12345  - 2024/04/14 10:00:01     LOG [NestApplication] Nest application successfully started
```

### 2. 创建用户 (POST /users)
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

**响应：**
```json
{
  "name": "alice",
  "email": "alice@example.com",
  "password": "123456",
  "age": 25,
  "id": 1,
  "created_at": "2024-04-14T10:00:01.123Z",
  "updated_at": "2024-04-14T10:00:01.123Z"
}
```

**SQL 日志：**
```sql
query: INSERT INTO "users"("name", "email", "password", "age", "created_at", "updated_at") 
       VALUES ($1, $2, $3, $4, DEFAULT, DEFAULT) 
       RETURNING "id", "created_at", "updated_at"
```

### 3. 查询所有用户 (GET /users)
```bash
curl http://localhost:3000/users
```

**响应：**
```json
[
  {
    "id": 1,
    "name": "alice",
    "email": "alice@example.com",
    "password": "123456",
    "age": 25,
    "created_at": "2024-04-14T10:00:01.123Z",
    "updated_at": "2024-04-14T10:00:01.123Z"
  }
]
```

### 4. 查询单个用户 (GET /users/:id)
```bash
curl http://localhost:3000/users/1
```

### 5. 更新用户 (PUT /users/:id)
```bash
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob",
    "age": 30
  }'
```

**响应：**
```json
{
  "id": 1,
  "name": "bob",
  "email": "alice@example.com",
  "password": "123456",
  "age": 30,
  "created_at": "2024-04-14T10:00:01.123Z",
  "updated_at": "2024-04-14T10:05:30.456Z"
}
```

**注意：** `updated_at` 自动更新

### 6. 删除用户 (DELETE /users/:id)
```bash
curl -X DELETE http://localhost:3000/users/1
```

**响应：** 无内容（HTTP 200）

### 7. 查询不存在的记录
```bash
curl http://localhost:3000/users/999
```

**响应（404 Not Found）：**
```json
{
  "message": "User with ID 999 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

## 使用数据库客户端查看数据

### 推荐工具
- **TablePlus**（推荐，免费版足够使用）
  - 下载：https://tableplus.com/
  - 界面美观，支持多种数据库
- **DBeaver**（开源免费）
  - 下载：https://dbeaver.io/
  - 功能强大，跨平台

### TablePlus 连接配置
1. 打开 TablePlus，点击 "Create a new connection"
2. 选择 PostgreSQL
3. 填写连接信息：
   - **Host:** localhost
   - **Port:** 5432
   - **User:** lisiyuan04（或你的系统用户名）
   - **Password:** （留空）
   - **Database:** nest_demo
4. 点击 "Connect"

### 查看表结构
```sql
-- 查看 users 表结构
\d users

-- 等价的 SQL
SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users';
```

**预期输出：**
```
 Column     | Type                        | Nullable | Default
------------+-----------------------------+----------+-------------------
 id         | integer                     | not null | nextval('users_id_seq')
 name       | character varying(100)      | not null |
 age        | integer                     | not null | 0
 email      | character varying           | not null |
 password   | character varying           | not null |
 created_at | timestamp without time zone | not null | now()
 updated_at | timestamp without time zone | not null | now()
```

### 手动查询数据
```sql
-- 查询所有用户
SELECT * FROM users;

-- 按年龄筛选
SELECT * FROM users WHERE age > 20;

-- 按邮箱搜索
SELECT * FROM users WHERE email LIKE '%example.com';

-- 统计用户数
SELECT COUNT(*) FROM users;
```

## 常见问题

### 1. 连接数据库失败
**错误信息：**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**解决方法：**
```bash
# 检查 PostgreSQL 是否运行
brew services list

# 如未运行，启动服务
brew services start postgresql

# 检查端口是否被占用
lsof -i :5432
```

### 2. 数据库不存在
**错误信息：**
```
Error: database "nest_demo" does not exist
```

**解决方法：**
```bash
# 创建数据库
createdb nest_demo

# 或使用 SQL
psql postgres -c "CREATE DATABASE nest_demo;"
```

### 3. 表结构未自动创建
**检查清单：**
- 确认 `synchronize: true` 已配置
- 确认实体文件后缀为 `.entity.ts`
- 确认模块中已使用 `TypeOrmModule.forFeature([Entity])`
- 重启应用

### 4. 字段更新未生效
**原因：** `update()` 方法返回更新结果，不返回实体

**解决方法：** 更新后重新查询（如示例代码所示）

## 关键点总结

1. **Homebrew PostgreSQL 特点：**
   - 默认用户是当前系统用户
   - 默认无密码
   - 数据存储在 `/usr/local/var/postgres`

2. **synchronize 使用规则：**
   - ✅ 开发环境：快速迭代，自动同步表结构
   - ❌ 生产环境：使用 Migration，避免数据丢失

3. **Repository 模式优势：**
   - 类型安全（TypeScript 支持）
   - 自动处理事务
   - 支持复杂查询（QueryBuilder）
   - 易于测试（可 Mock）

4. **异常处理：**
   - 使用 `NotFoundException` 处理记录不存在
   - `affected` 属性判断操作是否生效
   - Nest.js 自动将异常转换为 HTTP 响应

5. **数据验证：**
   - DTO 验证在 Controller 层（Day 3）
   - Entity 定义在 Service 层
   - 两者分离，职责清晰

6. **自动时间戳：**
   - `@CreateDateColumn()` 插入时自动设置
   - `@UpdateDateColumn()` 更新时自动修改
   - 无需手动维护，避免遗漏

## 下一步计划（Day 5）
- [ ] 实现用户认证（JWT）
- [ ] 添加用户角色权限
- [ ] 密码加密存储（bcrypt）
- [ ] 登录/注册接口