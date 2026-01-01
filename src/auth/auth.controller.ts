import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.name);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
  // ✅ ДОБАВЬ ЭТОТ ENDPOINT!
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req) {
    console.log('👤 GET /auth/me - User ID:', req.user.id);
    return this.authService.getMe(req.user.id);
  }

}
