import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

const userId = '11111111-1111-1111-1111-111111111111';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const client = {
    user: { findUnique: jest.fn(), create: jest.fn() },
    quota: { create: jest.fn() },
  };
  const prismaMock = { client };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('mock-token') } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('secret') } },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('login', () => {
    it('已有用户应签发 JWT', async () => {
      client.user.findUnique.mockResolvedValue({ id: userId, nickname: 'test' });
      const result = await service.login(userId);
      expect(result.accessToken).toBe('mock-token');
      expect(jwtService.sign).toHaveBeenCalledWith({ userId }, expect.anything());
    });

    it('不存在的用户应自动注册并签发 JWT', async () => {
      client.user.findUnique.mockResolvedValue(null);
      client.user.create.mockResolvedValue({ id: userId, nickname: '用户' });
      const result = await service.login(userId);
      expect(client.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { id: userId, nickname: '用户' } }),
      );
      expect(client.quota.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { userId, permanentPoints: 1000, monthlyPoints: 100 } }),
      );
      expect(result.accessToken).toBe('mock-token');
    });
  });
});
