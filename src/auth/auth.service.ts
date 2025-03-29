import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  private users = [
    {
      id: '1',
      email: 'test@example.com',
      password: '$2b$10$uosB0dWxqp5uyaBAEue.2e1fiw4iq5gq6Aiz823ff6mMmwAn2/gve',
    },
  ];

  private refreshTokens = new Map<string, string>();

  async login(loginDto: LoginDto, res: Response) {
    const user = this.users.find((u) => u.email === loginDto.email);
    if (!user) throw new UnauthorizedException('帳號或密碼錯誤');

    const isMatch: boolean = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isMatch) throw new UnauthorizedException('帳號或密碼錯誤');

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    const refreshToken = uuidv4();
    this.refreshTokens.set(refreshToken, user.id);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token: accessToken };
  }

  async register(registerDto: RegisterDto) {
    const existing = this.users.find((u) => u.email === registerDto.email);
    if (existing) {
      throw new Error('Email 已被註冊');
    }

    const hashed = await bcrypt.hash(registerDto.password, 10);
    const newUser = {
      id: (this.users.length + 1).toString(),
      email: registerDto.email,
      password: hashed,
    };

    this.users.push(newUser);
    return { message: '註冊成功' };
  }

  async refresh(refreshToken: string) {
    const userId = this.refreshTokens.get(refreshToken);
    if (!userId) throw new UnauthorizedException('無效的 refresh token');

    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new UnauthorizedException('使用者不存在');

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    return { access_token: accessToken };
  }
}
