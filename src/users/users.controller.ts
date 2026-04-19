import { Controller, Post, Body, Get, Query, ParseIntPipe, Put, Delete, Param, UseGuards, Request } from "@nestjs/common";
import { UserService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { AuthGuard } from "@nestjs/passport";

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UserService) {}

    @Post() 
    create(@Body() createUserDto: CreateUserDto) {
        return this.userService.createUser(createUserDto);
    }

    @Get()
    findAll() {
        return this.userService.findAll();
    }

    // 受保护接口：只有登录用户才能访问个人信息
    @UseGuards(AuthGuard('jwt')) // 手动在需要认证的接口上加路由保护
    @Get('profile')
    getProfile(@Request() req) {
        // req.user 就是在 JwtStrategy.validate 中返回的对象
        console.log(req);
        return req.user;
    }

    @Get(':id') // users/1
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.userService.findOne(id);
    }

    @Put(':id') // users/1
    update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.update(id, updateUserDto);
    }

    @Delete(':id') // users/1
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.userService.remove(id);
    }
}