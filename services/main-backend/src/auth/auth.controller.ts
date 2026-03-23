import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @ApiOperation({
    summary: 'Bắt đầu quá trình đăng nhập bằng Google',
    description: 'Chuyển hướng trình duyệt tới trang OAuth2 của Google. Sau khi xác thực thành công, Google sẽ gọi lại callback `/api/auth/google/callback`.',
  })
  @ApiResponse({ status: 302, description: 'Chuyển hướng tới trang đăng nhập Google' })
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @ApiOperation({
    summary: 'Callback Google OAuth — nhận token',
    description: 'Google gọi endpoint này sau khi xác thực. Hệ thống tìm/tạo user rồi phát hành JWT nội bộ (`accessToken`) dùng để gọi các API được bảo vệ.',
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công, trả về user và accessToken',
    schema: {
      example: {
        message: 'Xác thực Google thành công',
        user: {
          id: '63914c9d-3f89-4a60-a67d-be0d29b5e623',
          email: 'quytvo2626@gmail.com',
          userName: 'quý võ',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Xác thực Google không thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi máy chủ nội bộ' })
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req) {
    return this.authService.googleLogin(req);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Lấy thông tin profile user hiện tại',
    description: 'Yêu cầu JWT Bearer token hợp lệ trong header `Authorization`. Trả về thông tin user được giải mã từ token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin user từ JWT',
    schema: {
      example: {
        id: '63914c9d-3f89-4a60-a67d-be0d29b5e623',
        email: 'quytvo2626@gmail.com',
        userName: 'quý võ',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ hoặc đã hết hạn' })
  getProfile(@Req() req) {
    return req.user;
  }
}

