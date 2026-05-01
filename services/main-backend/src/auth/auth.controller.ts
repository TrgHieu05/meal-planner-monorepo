import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { z } from 'zod';

const GoogleIdTokenExchangeSchema = z.object({
  idToken: z.string().min(1),
});

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google/exchange')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Đổi Google ID token lấy JWT nội bộ cho mobile app',
    description:
      'Mobile app gửi `idToken` nhận từ Google Sign-In. Backend xác minh token với Google rồi phát hành `accessToken` nội bộ và trả về user hiện tại.',
  })
  @ApiBody({
    description: 'Google ID token nhận từ mobile app sau khi đăng nhập Google thành công',
    schema: {
      type: 'object',
      required: ['idToken'],
      properties: {
        idToken: {
          type: 'string',
          minLength: 1,
          example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...'
        },
      },
      additionalProperties: false,
    },
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
          isOnboardingCompleted: false,
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Google ID token không hợp lệ hoặc không có email đã xác minh',
  })
  @ApiResponse({ status: 422, description: 'Payload không hợp lệ' })
  async exchangeGoogleIdToken(@Body() body: unknown) {
    const payload = this.parseGoogleIdTokenExchange(body);
    return this.authService.exchangeGoogleIdToken(payload.idToken);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Lấy thông tin profile user hiện tại',
    description:
      'Yêu cầu JWT Bearer token hợp lệ trong header `Authorization`. Trả về thông tin user được giải mã từ token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin user từ JWT',
    schema: {
      example: {
        id: '63914c9d-3f89-4a60-a67d-be0d29b5e623',
        email: 'quytvo2626@gmail.com',
        userName: 'quý võ',
        isOnboardingCompleted: false,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  getProfile(@Req() req) {
    return req.user;
  }

  private parseGoogleIdTokenExchange(body: unknown) {
    const parsed = GoogleIdTokenExchangeSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        message: 'Google ID token exchange payload is invalid.',
        details: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }
}
