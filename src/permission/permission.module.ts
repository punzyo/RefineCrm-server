import { Module } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { APP_GUARD, Reflector } from '@nestjs/core';

@Module({
  providers: [
    Reflector,
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
  exports: [],
})
export class PermissionModule {}
