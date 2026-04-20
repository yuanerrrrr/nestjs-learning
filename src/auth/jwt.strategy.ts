import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'), // 必须与 JwtModule 注册时的 secret 一致
        });
    }

    async validate(payload: any) {
        // payload 包含 JWT 中存储的信息（sub, email 等）
        // 返回的对象会附加到 Request 对象上（req.user）
        return {userId: payload.sub, email: payload.email};
    }
}