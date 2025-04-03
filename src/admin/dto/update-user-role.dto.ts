import { IsUUID } from 'class-validator';

export class UpdateUserRoleDto {
  @IsUUID()
  userId: string;

  @IsUUID('4', { each: true })
  roleIds: string[];
}
