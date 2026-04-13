import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UserService {
    private users: any[] = [];
    private idCounter = 1;

    createUser(createUserDto: CreateUserDto) {
        const newUser = { id: this.idCounter++, ...createUserDto };
        this.users.push(newUser);
        return newUser;
    }

    findAll() {
        return this.users;
    }

    findOne(id: number) {
        const data = this.users.find(user => user.id === id);
        return data;
    }

    update(id: number, updateUserDto: UpdateUserDto) {
        const user = this.findOne(id);
        if (!user) return null;
        Object.assign(user, updateUserDto);
        return user;
    }

    remove(id: number) {
        const index = this.users.findIndex(user => user.id === id);
        if (index === -1) return null;
        this.users.splice(index, 1);
        return true;
    }
}