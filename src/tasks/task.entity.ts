import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { User } from "src/users/users.entity";

export enum TaskStatus {
    PENDING= 'pending',
    IN_PROGRESS= 'in-progress',
    COMPLETED= 'completed',
}

@Entity({name: 'tasks'})
export class Task {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({length: 200})
    title: string;

    @Column({type: 'text', nullable: true})
    description: string;

    // 任务状态：待处理、进行中或已完成，默认为待处理
    @Column({type: 'enum', default: TaskStatus.PENDING, enum: TaskStatus})
    status: TaskStatus;

    // 任务的截止日期，可选字段
    @Column({type: 'timestamp', nullable: true})
    dueDate: Date;

    // 与User的多对一关系：一个用户可以拥有多个任务，删除用户时级联删除其任务
    @ManyToOne(() => User, user => user.tasks, {onDelete: 'CASCADE'})
    user: User;

    @CreateDateColumn({name: 'created_at'})
    created_at: Date;

    @UpdateDateColumn({name: 'updated_at'})
    updated_at: Date;
}