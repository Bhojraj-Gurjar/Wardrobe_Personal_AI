import { Inject, Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DtoValidationPipe } from '../../../common/pipes/dto-validation.pipe';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { LogoutDto } from '../dto/logout.dto';

const registerPipe = DtoValidationPipe(RegisterDto);
const loginPipe = DtoValidationPipe(LoginDto);
const refreshPipe = DtoValidationPipe(RefreshTokenDto);
const logoutPipe = DtoValidationPipe(LogoutDto);

export @ApiTags('auth')
@Controller('auth')
class AuthController {
  constructor(@Inject(AuthService) authService) {
    this.authService = authService;
  }

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email or mobile already exists' })
  register(@Body(registerPipe) dto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with email or mobile' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body(loginPipe) dto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  refresh(@Body(refreshPipe) dto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  logout(@Body(logoutPipe) dto) {
    return this.authService.logout(dto);
  }
}
