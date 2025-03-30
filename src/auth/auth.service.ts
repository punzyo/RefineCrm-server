import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(loginDto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });
    if (!user) throw new UnauthorizedException('帳號或密碼錯誤');

    const isMatch: boolean = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isMatch) throw new UnauthorizedException('帳號或密碼錯誤');

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    const refreshToken = uuidv4();
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
      },
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token: accessToken };
  }

  async logout(
    refreshToken: string,
    res: Response,
  ): Promise<{ message: string }> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return { message: '已登出' };
  }

  async refresh(refreshToken: string): Promise<{ access_token: string }> {
    const found = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!found || !found.user) {
      throw new UnauthorizedException('無效的 refresh token');
    }

    const payload = { sub: found.user.id, email: found.user.email };
    const accessToken = this.jwtService.sign(payload);
    return { access_token: accessToken };
  }
}
