import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { Response } from 'express';
import { PrismaService } from 'src/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { LoginDto } from './dto/login.dto';
type UserWithRoles = User & {
  roles: {
    role: {
      permissions: {
        permission: {
          name: string;
        };
      }[];
    };
  }[];
};
const userWithPermissionsInclude = {
  roles: {
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  },
};
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(loginDto: LoginDto, res: Response) {
    const user = (await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: userWithPermissionsInclude,
    })) as UserWithRoles;
    if (!user) throw new UnauthorizedException('帳號或密碼錯誤');

    const allPermissions = user.roles.flatMap((userRole) =>
      userRole.role.permissions.map((rp) => rp.permission.name),
    );
    const payload = {
      sub: user.id,
      email: user.email,
      permissions: Array.from(new Set(allPermissions)),
    };
    const accessToken = this.jwtService.sign(payload);

    const refreshToken = uuidv4();
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        expiredAt: { lt: new Date() },
      },
    });

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiredAt: refreshExpiresAt,
      },
    });
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      userId: user.id,
      email: user.email,
      permissions: Array.from(new Set(allPermissions)),
    };
  }

  async logout(
    refreshToken: string,
    res: Response,
  ): Promise<{ message: string }> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return { message: '已登出' };
  }

  async refresh(refreshToken: string): Promise<{ access_token: string }> {
    const token = (await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: userWithPermissionsInclude,
        },
      },
    })) as {
      user: UserWithRoles;
      expiredAt: Date;
    } | null;

    if (!token || token.expiredAt < new Date()) {
      throw new UnauthorizedException('Refresh token 無效或已過期');
    }

    await this.prisma.refreshToken.deleteMany({
      where: {
        userId: token.user.id,
        expiredAt: { lt: new Date() },
      },
    });

    const allPermissions = token.user.roles.flatMap((userRole) =>
      userRole.role.permissions.map((rp) => rp.permission.name),
    );

    const payload = {
      sub: token.user.id,
      email: token.user.email,
      permissions: Array.from(new Set(allPermissions)),
    };

    const accessToken = this.jwtService.sign(payload);
    return { access_token: accessToken };
  }
}
