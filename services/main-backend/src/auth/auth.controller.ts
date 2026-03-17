import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @ApiOperation({ summary: 'Bắt đầu quá trình đăng nhập bằng Google' })
  @ApiResponse({
    status: 302,
    description: 'Chuyển hướng người dùng tới trang đăng nhập của Google',
  })
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @ApiOperation({ summary: 'Xử lý phản hồi từ Google sau khi đăng nhập' })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công và trả về thông tin user',
  })
  @ApiResponse({ status: 401, description: 'Xác thực không thành công' })
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req) {
    return this.authService.googleLogin(req);
  }
}
