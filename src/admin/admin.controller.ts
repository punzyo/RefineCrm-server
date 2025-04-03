import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { PermissionsGuard } from 'src/permission/permissions.guard';
import { SetMetadata } from '@nestjs/common';
import { Permission } from 'src/permission/permissions.enum';
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
}
