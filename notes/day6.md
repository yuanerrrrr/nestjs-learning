# Day 6 - 环境变量配置 + Task 模块 + 数据隔离

## 今日完成
- [x] 安装 @nestjs/config
- [x] 创建 .env 文件，配置 JWT_SECRET
- [x] 使用 registerAsync 从环境变量读取 JWT 配置
- [x] 修改 JwtStrategy 使用 ConfigService
- [x] 创建 Task 模块（Module, Service, Controller）
- [x] 定义 Task 实体，添加 @ManyToOne 关联 User
- [x] 在 User 实体中添加 @OneToMany 反向关联
- [x] 实现 TasksService 的所有 CRUD 方法（带 userId 数据隔离）
- [x] 实现 TasksController，使用 @UseGuards(AuthGuard('jwt')) 保护所有路由
- [x] 从 req.user 获取当前用户信息
- [x] 测试所有接口，验证数据隔离生效
- [x] 学习 relations 预加载关联数据

## 完整的流程图

```
用户请求 → JWT Guard 验证 → JwtStrategy.validate() → req.user = {userId, email}
                                                              ↓
                                                     Controller 获取 userId
                                                              ↓
                                                     Service 带 userId 查询
                                                              ↓
                                                     数据隔离（只能访问自己的任务）
```

## 关键代码片段

### 1. 环境变量配置
```ts
// .env
JWT_SECRET=your-super-secret-key

// auth.module.ts - JwtModule 异步配置
JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: { expiresIn: '1d' },
  }),
  inject: [ConfigService],
})

// jwt.strategy.ts - 使用 ConfigService
constructor(private configService: ConfigService) {
  super({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,
    secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
  });
}
```

### 2. Task 实体定义
```ts
@Entity({name: 'tasks'})
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({length: 200})
  title: string;

  @Column({type: 'text', nullable: true})
  description: string;

  @Column({type: 'enum', default: TaskStatus.PENDING, enum: TaskStatus})
  status: TaskStatus;

  @Column({type: 'timestamp', nullable: true})
  dueDate: Date;

  // 关键：多对一关联 User
  @ManyToOne(() => User, user => user.tasks, {onDelete: 'CASCADE'})
  user: User;

  @CreateDateColumn({name: 'created_at'})
  created_at: Date;

  @UpdateDateColumn({name: 'updated_at'})
  updated_at: Date;
}
```

### 3. User 实体反向关联
```ts
@Entity('users')
export class User {
  // ... 其他字段

  // 关键：一对多反向关联 Task
  @OneToMany(() => Task, task => task.user)
  tasks: Task[];
}
```

### 4. TasksService 数据隔离实现
```ts
// 创建任务时关联用户
async createTask(userId: number, createTaskDto: CreateTaskDto): Promise<Task> {
  const task = this.tasksRepository.create({
    ...createTaskDto,
    user: {id: userId},  // 关键：关联用户ID
  });
  return this.tasksRepository.save(task);
}

// 查询时过滤用户数据
async findAllByUser(userId: number): Promise<Task[]> {
  return this.tasksRepository.find({
    where: {
      user: {id: userId},  // 关键：只查询该用户的任务
    },
    relations: ['user'],   // 预加载关联数据
    order: {
      created_at: 'DESC',
    },
  });
}

// 更新前先验证任务所属
async updateByUser(userId: number, taskId: number, updateTaskDto: UpdateTaskDto): Promise<Task> {
  await this.findOneByUser(userId, taskId);  // 验证任务存在且属于该用户
  await this.tasksRepository.update(taskId, updateTaskDto);
  return await this.findOneByUser(userId, taskId);
}

// 删除时双重验证
async removeByUser(userId: number, taskId: number): Promise<void> {
  const task = await this.tasksRepository.delete({
    id: taskId,
    user: {id: userId},  // 关键：确保只能删除自己的任务
  });
  if (task.affected === 0) {
    throw new Error('Task not deleted');
  }
}
```

### 5. TasksController JWT 保护
```ts
@Controller('tasks')
@UseGuards(AuthGuard('jwt'))  // 关键：保护整个 Controller
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  createTask(@Request() req, @Body(ValidationPipe) createTaskDto: CreateTaskDto): Promise<Task> {
    // req.user 来自 JwtStrategy.validate 的返回值 { userId, email }
    return this.tasksService.createTask(req.user.userId, createTaskDto);
  }

  @Get()
  findAll(@Request() req): Promise<Task[]> {
    return this.tasksService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) taskId: number): Promise<Task> {
    return this.tasksService.findOneByUser(req.user.userId, taskId);
  }

  @Put(':id')
  updateTask(@Request() req, @Param('id', ParseIntPipe) taskId: number, @Body(ValidationPipe) updateTaskDto: UpdateTaskDto): Promise<Task> {
    return this.tasksService.updateByUser(req.user.userId, taskId, updateTaskDto);
  }

  @Delete(':id')
  removeTask(@Request() req, @Param('id', ParseIntPipe) taskId: number): Promise<void> {
    return this.tasksService.removeByUser(req.user.userId, taskId);
  }

  @Get('filter/status')
  findByStatus(@Request() req, @Query('status') status: TaskStatus): Promise<Task[]> {
    return this.tasksService.findByStatus(req.user.userId, status);
  }
}
```

### 6. CreateTaskDto 验证
```ts
export class CreateTaskDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
```

## 核心概念

### 数据隔离
- 所有 Service 方法都接收 `userId` 参数
- 查询时使用 `where: { user: {id: userId} }` 过滤数据
- 确保用户只能访问自己的任务

### JWT 认证流程
1. 用户登录获取 JWT Token
2. 请求时在 Header 中携带 `Authorization: Bearer <token>`
3. `AuthGuard('jwt')` 自动验证 Token
4. `JwtStrategy.validate()` 解析 Token 并返回用户信息
5. 用户信息附加到 `req.user` 上，这是Passport中间件自动做的
6. Controller 从 `req.user` 获取 userId

### TypeORM 关联关系
- `@ManyToOne`: Task 多对一关联 User
- `@OneToMany`: User 一对多关联 Task
- `relations: ['user']`: 预加载关联数据
- `onDelete: 'CASCADE'`: 删除用户时级联删除任务

## 测试接口

### 1. 创建任务
```bash
POST http://localhost:3000/tasks
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "title": "完成项目文档",
  "description": "编写 Day 6 学习笔记",
  "status": "pending",
  "dueDate": "2024-12-31"
}
```

### 2. 获取所有任务
```bash
GET http://localhost:3000/tasks
Authorization: Bearer <your_jwt_token>
```

### 3. 获取单个任务
```bash
GET http://localhost:3000/tasks/1
Authorization: Bearer <your_jwt_token>
```

### 4. 更新任务
```bash
PUT http://localhost:3000/tasks/1
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "status": "completed"
}
```

### 5. 删除任务
```bash
DELETE http://localhost:3000/tasks/1
Authorization: Bearer <your_jwt_token>
```

### 6. 按状态筛选
```bash
GET http://localhost:3000/tasks/filter/status?status=pending
Authorization: Bearer <your_jwt_token>
```

## 学到的知识点

1. **环境变量配置**: 使用 `@nestjs/config` 管理敏感信息
2. **异步模块注册**: `registerAsync` 实现动态配置
3. **数据隔离**: 通过 userId 确保用户只能访问自己的数据
4. **关联关系**: TypeORM 的 `@ManyToOne` 和 `@OneToMany`
5. **关联预加载**: `relations` 选项预加载关联数据
6. **级联删除**: `onDelete: 'CASCADE'` 自动清理关联数据
7. **路由保护**: `@UseGuards(AuthGuard('jwt'))` 保护整个 Controller
8. **参数管道**: `ParseIntPipe` 自动转换和验证路由参数

## 注意事项

- 所有涉及用户数据的操作都必须带上 userId 进行隔离
- 删除操作要确保 `affected > 0`，否则可能是越权访问
- 使用 `relations` 预加载关联数据时注意性能影响
- JWT_SECRET 必须保密，不要提交到代码仓库