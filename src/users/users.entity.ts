import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Task } from "src/tasks/task.entity";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({length: 100})
    name: string;

    @Column({type: 'int', default: 0})
    age: number;

    @Column({unique: true})
    email: string;

    @Column()
    password: string;

    @CreateDateColumn({name: 'created_at'})
    created_at: Date;

    @UpdateDateColumn({name: 'updated_at'})
    updated_at: Date;

    @OneToMany(() => Task, task => task.user)
    tasks: Task[];
}