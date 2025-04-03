import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterAdminDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new Error('Email 已被註冊');

    const hashed = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
      },
    });
    return { message: '註冊成功' };
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              permissions: {
                some: {
                  permission: {
                    name: { startsWith: 'admin:' },
                  },
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });
  }

  async updateUserRoles(dto: UpdateUserRoleDto) {
    const { userId, roleIds } = dto;

    await this.prisma.userRole.deleteMany({
      where: { userId },
    });

    const data = roleIds.map((roleId) => ({ userId, roleId }));
    await this.prisma.userRole.createMany({ data });

    return { message: '權限已更新' };
  }
}
