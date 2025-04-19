import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Response } from 'express';
import { parseSimpleRestQuery } from 'src/utils/parseSimpleRestQuery';
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
    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email 已被註冊',
      });
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
      },
    });
    return {
      code: 'REGISTRATION_SUCCESS',
      message: '註冊成功',
    };
  }

  async findAll(query: Record<string, string>, res: Response) {
    const { skip, take, orderBy, where } = parseSimpleRestQuery(query);

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const userIds = users.map((u) => u.id);

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        role: {
          select: { name: true },
        },
      },
    });

    const roleMap = new Map<string, string[]>();
    for (const ur of userRoles) {
      const list = roleMap.get(ur.userId) ?? [];
      list.push(ur.role.name);
      roleMap.set(ur.userId, list);
    }

    const result = users.map((user) => ({
      ...user,
      roles: roleMap.get(user.id) ?? [],
    }));

    res.setHeader('x-total-count', total.toString());
    return result;
  }

  async getRoles(): Promise<{ id: string; name: string }[]> {
    return await this.prisma.role.findMany({
      select: { id: true, name: true },
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
