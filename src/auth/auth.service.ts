import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ) {}

    // 验证用户：根据邮箱查找用户，并比对密码
    async validateUser(email: string, password: string) {
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentails');
        }
        // 返回用户信息，排除密码
        const {password: _, ...result} = user;
        return result;
    }

    // 登录：生成 JWT token
    login(user: any) {
        const payload = {sub: user.id, email: user.email};
        return {
            access_token: this.jwtService.sign(payload),
        }
    }
}
