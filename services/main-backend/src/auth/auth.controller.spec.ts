import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
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

    it('should throw when the payload is invalid', async () => {
      await expect(controller.exchangeGoogleIdToken({})).rejects.toMatchObject({
        status: 422,
      });
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
