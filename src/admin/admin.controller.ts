import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { Permission } from 'src/permission/permissions.enum';
import { PermissionsGuard } from 'src/permission/permissions.guard';
import { AdminService } from './admin.service';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('register')
  register(@Body() dto: RegisterAdminDto) {
    return this.adminService.register(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(
    @Request()
    req: ExpressRequest & { user: { userId: string; email: string } },
  ) {
    return req.user;
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @SetMetadata('permissions', [Permission.AdminRead])
  findAll() {
    return this.adminService.findAll();
  }

  @Patch('roles')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @SetMetadata('permissions', [Permission.AdminWrite])
  updateRoles(@Body() dto: UpdateUserRoleDto) {
    return this.adminService.updateUserRoles(dto);
  }
}
