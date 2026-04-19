import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { InjectRepository } from "@nestjs/typeorm"; // 用于注入 TypeORM 的数据库仓库
import { User } from "./users.entity";
import { Repository } from "typeorm"; // TypeORM 的仓库类，提供数据库操作方法
import * as bcrypt from "bcrypt";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {}

    // 对密码进行哈希
    async createUser(createUserDto: CreateUserDto): Promise<User> {
        // 生成盐（salt rounds = 10 是常用值）
        const salt = await bcrypt.genSalt(10);
        // 哈希密码
        const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
        const user = this.usersRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });
        return this.usersRepository.save(user);
    }

    findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async findOne(id: number): Promise<User> {
        const data = await this.usersRepository.findOneBy({id});
        if (!data) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return data;
    }

    async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.usersRepository.update(id, updateUserDto);
        if (user.affected === 0) {
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

    async findByEmail(email: string): Promise<User | null> {
        return await this.usersRepository.findOneBy({email});
    }
}