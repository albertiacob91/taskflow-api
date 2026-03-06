import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @SkipThrottle()
  @Post('register')
  @ApiOkResponse({ description: 'Register and return tokens' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('login')
  @ApiOkResponse({ description: 'Login and return tokens' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh')
  @ApiOkResponse({ description: 'Rotate refresh token and return new tokens' })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @ApiOkResponse({ description: 'Invalidate refresh token' })
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }
}