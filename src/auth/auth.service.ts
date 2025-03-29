import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';

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

  async login(loginDto: LoginDto) {
    const user = this.users.find((u) => u.email === loginDto.email);
    if (!user) throw new UnauthorizedException('帳號或密碼錯誤');

    const isMatch: boolean = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isMatch) throw new UnauthorizedException('帳號或密碼錯誤');

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    return { access_token: token };
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
}
