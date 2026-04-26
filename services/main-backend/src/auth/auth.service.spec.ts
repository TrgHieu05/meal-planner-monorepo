import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderEnum } from '@meal/database';

const mockUser = {
  id: '63914c9d-3f89-4a60-a67d-be0d29b5e623',
  email: 'quytvo2626@gmail.com',
  userName: 'quý võ',
  gender: 'U',
  providers: [
    {
      provider: ProviderEnum.GOOGLE,
      providerId: 'google-sub-123',
    },
  ],
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  userProvider: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mocked-jwt-token'),
};

const mockConfigService = {
  get: jest.fn<string | undefined, [string]>((key: string) => {
    const values: Record<string, string> = {
      GOOGLE_WEB_CLIENT_ID: 'web-client-id',
    };

    return values[key];
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exchangeGoogleIdToken()', () => {
    it('should create a new user when the Google account signs in for the first time', async () => {
      const newUser = {
        ...mockUser,
        id: 'new-user-id',
        email: 'new@gmail.com',
        userName: 'New User',
        providers: [
          {
            provider: ProviderEnum.GOOGLE,
            providerId: 'new-google-sub',
          },
        ],
      };

      jest
        .spyOn(service as any, 'verifyGoogleIdToken')
        .mockResolvedValueOnce({
          providerId: 'new-google-sub',
          email: 'new@gmail.com',
          firstName: 'New',
          lastName: 'User',
        });
      mockPrisma.userProvider.findFirst.mockResolvedValueOnce(null);
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce(newUser);

      const result = await service.exchangeGoogleIdToken('google-id-token');

      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        message: 'Xác thực Google thành công',
        user: {
          id: 'new-user-id',
          email: 'new@gmail.com',
          userName: 'New User',
        },
        accessToken: 'mocked-jwt-token',
      });
    });

    it('should exchange a verified Google id token for an app JWT', async () => {
      jest
        .spyOn(service as any, 'verifyGoogleIdToken')
        .mockResolvedValueOnce({
          providerId: 'google-sub-123',
          email: 'quytvo2626@gmail.com',
          firstName: 'quý',
          lastName: 'võ',
          fullName: 'quý võ',
        });
      mockPrisma.userProvider.findFirst.mockResolvedValueOnce({
        user: mockUser,
      });

      const result = await service.exchangeGoogleIdToken('google-id-token');

      expect(result).toMatchObject({
        message: 'Xác thực Google thành công',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          userName: mockUser.userName,
        },
        accessToken: 'mocked-jwt-token',
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
      });
    });

    it('should throw UnauthorizedException when the Google token is invalid', async () => {
      jest
        .spyOn(service as any, 'verifyGoogleIdToken')
        .mockRejectedValueOnce(
          new UnauthorizedException('Google ID token không hợp lệ'),
        );

      await expect(
        service.exchangeGoogleIdToken('invalid-google-id-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject a Google account whose email is not verified', async () => {
      jest
        .spyOn((service as any).googleAuthClient, 'verifyIdToken')
        .mockResolvedValueOnce({
          getPayload: () => ({
            sub: 'google-sub-789',
            email: 'user@example.com',
            email_verified: false,
          }),
        } as any);

      await expect(
        (service as any).verifyGoogleIdToken('google-id-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when GOOGLE_WEB_CLIENT_ID is missing', async () => {
      mockConfigService.get.mockReturnValueOnce(undefined);

      expect(() => (service as any).getGoogleWebAudience()).toThrow(
        InternalServerErrorException,
      );
    });

    it('should link the Google provider to an existing user with the same email', async () => {
      jest
        .spyOn(service as any, 'verifyGoogleIdToken')
        .mockResolvedValueOnce({
          providerId: 'google-sub-456',
          email: 'quytvo2626@gmail.com',
          firstName: 'quý',
          lastName: 'võ',
        });
      mockPrisma.userProvider.findFirst.mockResolvedValueOnce(null);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ ...mockUser, providers: [] })
        .mockResolvedValueOnce({
          ...mockUser,
          providers: [
            {
              provider: ProviderEnum.GOOGLE,
              providerId: 'google-sub-456',
            },
          ],
        });

      await service.exchangeGoogleIdToken('google-id-token');

      expect(mockPrisma.userProvider.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          provider: ProviderEnum.GOOGLE,
          providerId: 'google-sub-456',
        },
      });
    });
  });
});
