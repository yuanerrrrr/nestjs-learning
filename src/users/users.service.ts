import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { InjectRepository } from "@nestjs/typeorm"; // 用于注入 TypeORM 的数据库仓库
import { User } from "./users.entity";
import { Repository } from "typeorm"; // TypeORM 的仓库类，提供数据库操作方法

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {}

    createUser(createUserDto: CreateUserDto): Promise<User> {
        const user = this.usersRepository.create(createUserDto);
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
}