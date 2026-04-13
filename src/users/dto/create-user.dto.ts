import { IsString, IsEmail, IsOptional, MinLength, IsInt, Min, Max  } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
    @IsString()
    @MinLength(2)
    @Transform(({value}) => value.toLowerCase())
    name: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @MinLength(6)
    password: string;

    @IsInt()
    @Min(14)
    @Max(120)
    age: number;
}