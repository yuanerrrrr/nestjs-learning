import { IsString, IsBoolean, MaxLength, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TaskStatus } from 'src/tasks/task.entity';

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