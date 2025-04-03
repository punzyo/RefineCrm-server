import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
