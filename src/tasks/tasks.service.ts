import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Task, TaskStatus } from './task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private tasksRepository: Repository<Task>,
        private readonly logger = new Logger('TasksService.name'),
    ) {}

    async createTask(userId: number, createTaskDto: CreateTaskDto): Promise<Task> {
        this.logger.log(`Creating task for user ${userId}`);
        const task = this.tasksRepository.create({
            ...createTaskDto, // 扩展创建任务的数据
            user: {id: userId}, // 关联用户ID
        });
        return this.tasksRepository.save(task);
    }

    async findAllByUser(userId: number, page: number = 1, limit: number = 10): Promise<{
        items: Task[];
        total: number;
        page: number;
        limit: number;
    }> {
        const [items, total] = await this.tasksRepository.findAndCount({
            where: {
                user: {id: userId}, // 查询指定用户的所有任务
            },
            order: {
                created_at: 'DESC', // 默认按创建时间降序排序
            },
            skip: (page - 1) * limit, // 跳过 (page - 1) * limit 条记录
            take: limit, // 每页 limit 条记录
        });
        return {
            items,
            total,
            page,
            limit,
        };
    }

    async findOneByUser(userId: number, taskId: number): Promise<Task> {
        const task = await this.tasksRepository.findOne({
            where: {
                id: taskId,
                user: {id: userId}, // 确保任务属于指定用户
            },
            relations: ['user'], // 预加载 user 关联数据
        });
        if (!task) {
            throw new NotFoundException(`Task with ID ${taskId} not found`);
        }
        return task;
    }

    async updateByUser(userId: number, taskId: number, updateTaskDto: UpdateTaskDto): Promise<Task> {
        // 先确认任务存在且属于该用户
        await this.findOneByUser(userId, taskId);
        await this.tasksRepository.update(taskId, updateTaskDto);
        return await this.findOneByUser(userId, taskId);
    }

    async removeByUser(userId: number, taskId: number): Promise<void> {
        // 先确认任务存在且属于该用户
        const task = await this.tasksRepository.delete({
            id: taskId,
            user: {id: userId}, // 确保任务属于指定用户
        });
        if (task.affected === 0) {
            throw new Error('Task not deleted');
        }
    }

    async findByStatus(userId: number, status: TaskStatus): Promise<Task[]> {
        return this.tasksRepository.find({
            where: {
                user: {id: userId},
                status,
            },
            relations: ['user'],  // 预加载 user 关联数据
            order: {
                created_at: 'DESC',
            },
        });
    }
}
