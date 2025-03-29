import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

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
}
