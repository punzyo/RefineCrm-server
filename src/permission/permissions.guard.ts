import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from './permissions.enum';

interface RequestUser {
  permissions: string[];
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions) return true;

    const req = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = req.user;
    const userPermissions: string[] = user?.permissions || [];

    const hasPermission = requiredPermissions.every((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasPermission) throw new ForbiddenException('權限不足');

    return true;
  }
}
