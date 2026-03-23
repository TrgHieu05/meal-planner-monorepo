import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { InternalServerErrorException } from '@nestjs/common';

const mockUser = {
  id: '63914c9d-3f89-4a60-a67d-be0d29b5e623',
  email: 'quytvo2626@gmail.com',
  userName: 'quý võ',
  gender: 'U',
  providers: [],
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mocked-jwt-token'),
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
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      const req = {
        user: { email: 'quytvo2626@gmail.com', firstName: 'quý', lastName: 'võ' },
      };
      const result = await service.googleLogin(req);

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
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      const newUser = { ...mockUser, id: 'new-uuid' };
      mockPrisma.user.create.mockResolvedValueOnce(newUser);

      const req = {
        user: { email: 'new@gmail.com', firstName: 'New', lastName: 'User' },
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
      mockPrisma.user.findUnique.mockRejectedValueOnce(new Error('DB connection failed'));

      const req = {
        user: { email: 'quytvo2626@gmail.com', firstName: 'quý', lastName: 'võ' },
      };

      await expect(service.googleLogin(req)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
