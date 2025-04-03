import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterAdminDto } from './dto/register-admin.dto';

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
}
