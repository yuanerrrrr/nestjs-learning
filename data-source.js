"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const users_entity_1 = require("./src/users/users.entity");
const task_entity_1 = require("./src/tasks/task.entity");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [users_entity_1.User, task_entity_1.Task],
    synchronize: false,
    migrations: ['src/database/migrations/*.ts'],
    logging: true,
});
//# sourceMappingURL=data-source.js.map