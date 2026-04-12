# Day 2 - 控制器、服务、依赖注入与模块

## 今日完成
- [x] 使用各种路由装饰器（@Get, @Post, @Put, @Delete, @Param, @Query, @Body）
- [x] 创建 Service 并通过依赖注入在 Controller 中使用
- [x] 使用 CLI 生成模块、服务、控制器
- [x] 将 DemoService 独立成 DemoModule
- [x] DemoModule 组织 DemoController 和 DemoService，AppModule 导入 DemoModule 后即可使用其导出的控制器

## 核心概念

### 1. 控制器 (Controller)
负责处理 HTTP 请求，通过装饰器定义路由和请求方法。

### 2. 服务 (Service)
包含业务逻辑，使用 `@Injectable()` 装饰器标记，表示可被依赖注入。

### 3. 依赖注入 (Dependency Injection)
- Controller 构造函数中声明依赖的服务
- Nest.js 自动实例化服务并注入到控制器中
- 这种方式实现了"控制反转"，代码更易测试和维护

### 4. 模块 (Module)
- 使用 `@Module()` 装饰器
- 组织相关的控制器和服务
- 导入其他模块以使用其导出的内容

## 关键代码示例

### 完整控制器代码
```ts
@Controller('demo')
export class DemoController {
    // 依赖注入：通过构造函数注入服务
    constructor(private readonly demoService: DemoService) {}

    @Get('hello') // GET /demo/hello
    helloDemo(): string {
        return this.demoService.helloDemo();
    }

    @Get('greet/:name') // GET /demo/greet/:name - 路径参数
    greetName(@Param('name') name: string): string {
        return this.demoService.greetName(name);
    }

    @Post('search') // POST /demo/search?id=1&page=2 - 查询参数
    searchDemo(@Query('id') id: string, @Query('page') page: string): string {
        return this.demoService.searchDemo(id, page);
    }

    @Post('echo') // POST /demo/echo - 请求体
    echoDemo(@Body() body: any): string {
        return this.demoService.echoDemo(body);
    }

    @Post('update/:id') // POST /demo/update/:id - 路径参数 + 请求体
    updateDemo(@Param('id') id: string, @Body() body: any): string {
        return this.demoService.updateDemo(id, body);
    }
    
    @Delete('delete/:id') // DELETE /demo/delete/:id
    removeUser(@Param('id') id: string): string {
        return this.demoService.deleteDemo(id);
    }
}
```

### 服务代码
```ts
@Injectable()
export class DemoService {
    helloDemo(): string { return 'get demo hello'; }
    
    greetName(name: string): string {
        return `the name is ${name}`;
    }
    
    searchDemo(id: string, page: string): string {
        return `Search for ${id} on page ${page}`;
    }
    
    echoDemo(body: any): string { return body; }
    
    updateDemo(id: string, body: any): string {
        return `update ${id} with body ${JSON.stringify(body)}`;
    }
    
    deleteDemo(id: string): string {
        return `user with id ${id} removed`;
    }
}
```

### 模块代码
```ts
@Module({
    imports: [],        // 导入其他模块
    controllers: [DemoController],  // 本模块的控制器
    providers: [DemoService],       // 本模块的服务
})
export class DemoModule {}
```

### AppModule 导入
```ts
@Module({
    imports: [DemoModule],  // 导入 DemoModule
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
```

## 路由装饰器速查
| 装饰器 | HTTP 方法 | 用途 |
|--------|-----------|------|
| @Get() | GET | 获取数据 |
| @Post() | POST | 创建数据 |
| @Put() | PUT | 更新数据（完整） |
| @Patch() | PATCH | 更新数据（部分） |
| @Delete() | DELETE | 删除数据 |
| @Param() | - | 获取路径参数 |
| @Query() | - | 获取查询参数 |
| @Body() | - | 获取请求体 |

## CLI 命令
```bash
# 生成完整模块（controller + service + module）
nest g resource demo

# 单独生成
nest g controller demo
nest g service demo  
nest g module demo
```

