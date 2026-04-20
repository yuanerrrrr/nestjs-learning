import { Controller, Put, UseGuards, ValidationPipe } from '@nestjs/common';
import { Get, Post, Body, Query, Param, Delete, Request } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthGuard } from '@nestjs/passport';
import { ParseIntPipe } from '@nestjs/common';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
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
