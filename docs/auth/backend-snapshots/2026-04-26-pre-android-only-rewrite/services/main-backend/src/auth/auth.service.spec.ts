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
  get: jest.fn((key: string) => {
    const values: Record<string, string> = {
      GOOGLE_CLIENT_ID: 'web-client-id',
      GOOGLE_ANDROID_CLIENT_ID: 'android-client-id',
      GOOGLE_IOS_CLIENT_ID: 'ios-client-id',
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

  // ── login() ──────────────────────────────────────────────────────────────
  describe('login()', () => {
    it('should sign a JWT with correct payload and return accessToken', async () => {
      const result = await service.login(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
      });
      expect(result).toEqual({ accessToken: 'mocked-jwt-token' });
    });
  });

  // ── googleLogin() — no user in request ──────────────────────────────────
  describe('googleLogin()', () => {
    it('should return no-data message when req.user is missing', async () => {
      const result = await service.googleLogin({});
      expect(result).toEqual({ message: 'Không có dữ liệu từ Google' });
    });

    // ── existing user ────────────────────────────────────────────────────
    it('should find existing user and return accessToken without creating a new one', async () => {
      mockPrisma.userProvider.findFirst.mockResolvedValueOnce(null);
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      const req = {
        user: {
          email: 'quytvo2626@gmail.com',
          firstName: 'quý',
          lastName: 'võ',
          providerId: 'google-sub-123',
        },
      };
      const result = await service.googleLogin(req);

      expect(mockPrisma.userProvider.findFirst).toHaveBeenCalledWith({
        where: {
          provider: ProviderEnum.GOOGLE,
          providerId: 'google-sub-123',
        },
        include: {
          user: {
            include: {
              providers: true,
            },
          },
        },
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'quytvo2626@gmail.com' },
        include: { providers: true },
      });
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        message: 'Xác thực Google thành công',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          userName: mockUser.userName,
        },
        accessToken: 'mocked-jwt-token',
      });
    });

    // ── new user ─────────────────────────────────────────────────────────
    it('should create a new user when not found in DB', async () => {
      mockPrisma.userProvider.findFirst.mockResolvedValueOnce(null);
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      const newUser = {
        ...mockUser,
        id: 'new-uuid',
        providers: [
          {
            provider: ProviderEnum.GOOGLE,
            providerId: 'new-google-sub',
          },
        ],
      };
      mockPrisma.user.create.mockResolvedValueOnce(newUser);

      const req = {
        user: {
          email: 'new@gmail.com',
          firstName: 'New',
          lastName: 'User',
          providerId: 'new-google-sub',
        },
      };
      const result = await service.googleLogin(req);

      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        message: 'Xác thực Google thành công',
        user: { id: 'new-uuid' },
        accessToken: 'mocked-jwt-token',
      });
    });

    // ── DB error ─────────────────────────────────────────────────────────
    it('should throw InternalServerErrorException when DB throws', async () => {
      mockPrisma.userProvider.findFirst.mockResolvedValueOnce(null);
      mockPrisma.user.findUnique.mockRejectedValueOnce(
        new Error('DB connection failed'),
      );

      const req = {
        user: {
          email: 'quytvo2626@gmail.com',
          firstName: 'quý',
          lastName: 'võ',
        },
      };

      await expect(service.googleLogin(req)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('exchangeGoogleIdToken()', () => {
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
  });
});
