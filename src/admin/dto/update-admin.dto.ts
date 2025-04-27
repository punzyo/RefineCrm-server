import { IsArray, IsEmail, IsString } from 'class-validator';

export class UpdateAdminDto {
  @IsString()
  userId: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsArray()
  roleIds: string[];
}
