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
    entities: [User, Task], // 告诉 TypeORM 我们定义了哪些实体
    synchronize: false, // 开发环境自动同步表结构,生产环境请关闭
    migrations: ['src/database/migrations/*.ts'], // 指定迁移文件所在的目录
    logging: true, // 开启 SQL 打印
});