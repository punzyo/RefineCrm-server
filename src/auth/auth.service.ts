// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  login(loginDto: LoginDto) {
    return { token: 'your-generated-token' };
  }
}
