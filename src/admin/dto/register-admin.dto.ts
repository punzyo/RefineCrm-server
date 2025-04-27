import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';

export class RegisterAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  roleIds: string[];
}
