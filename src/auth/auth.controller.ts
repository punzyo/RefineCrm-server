import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(loginDto, res);
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request & { cookies: Record<string, string> },
  ): Promise<{ access_token: string }> {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('未提供 refresh token');
    }

    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  async logout(
    @Req() req: Request & { cookies: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      return { message: '已登出' };
    }

    return this.authService.logout(refreshToken, res);
  }
}
