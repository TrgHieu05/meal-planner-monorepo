import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  googleLogin: jest.fn(),
  exchangeGoogleIdToken: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── googleAuthRedirect ───────────────────────────────────────────────────
  describe('googleAuthRedirect()', () => {
    it('should call authService.googleLogin with the request object', async () => {
      const mockReq = { user: { email: 'quytvo2626@gmail.com' } };
      const mockResult = {
        message: 'Xác thực Google thành công',
        user: {
          id: 'uuid-123',
          email: 'quytvo2626@gmail.com',
          userName: 'quý võ',
        },
        accessToken: 'jwt-token-here',
      };
      mockAuthService.googleLogin.mockResolvedValueOnce(mockResult);

      const result = await controller.googleAuthRedirect(mockReq as any);

      expect(mockAuthService.googleLogin).toHaveBeenCalledTimes(1);
      expect(mockAuthService.googleLogin).toHaveBeenCalledWith(mockReq);
      expect(result).toEqual(mockResult);
    });

    it('should return no-data message when req.user is undefined', async () => {
      const mockReq = {};
      mockAuthService.googleLogin.mockResolvedValueOnce({
        message: 'Không có dữ liệu từ Google',
      });

      const result = await controller.googleAuthRedirect(mockReq as any);

      expect(result).toMatchObject({ message: 'Không có dữ liệu từ Google' });
    });
  });

  describe('exchangeGoogleIdToken()', () => {
    it('should call authService.exchangeGoogleIdToken with the provided idToken', async () => {
      const mockResult = {
        message: 'Xác thực Google thành công',
        user: {
          id: 'uuid-123',
          email: 'quytvo2626@gmail.com',
          userName: 'quý võ',
        },
        accessToken: 'jwt-token-here',
      };
      mockAuthService.exchangeGoogleIdToken.mockResolvedValueOnce(mockResult);

      const result = await controller.exchangeGoogleIdToken({
        idToken: 'google-id-token',
      });

      expect(mockAuthService.exchangeGoogleIdToken).toHaveBeenCalledWith(
        'google-id-token',
      );
      expect(result).toEqual(mockResult);
    });
  });

  // ── getProfile ───────────────────────────────────────────────────────────
  describe('getProfile()', () => {
    it('should return req.user directly', () => {
      const mockUser = {
        id: '63914c9d-3f89-4a60-a67d-be0d29b5e623',
        email: 'quytvo2626@gmail.com',
        userName: 'quý võ',
      };
      const mockReq = { user: mockUser };

      const result = controller.getProfile(mockReq as any);

      expect(result).toEqual(mockUser);
    });
  });
});
