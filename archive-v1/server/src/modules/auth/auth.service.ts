import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 登录：根据 userId 签发 JWT。
   *
   * 当前实现直接接受 userId（开发阶段）。
   * M2 接入 code2Session 后改为根据 code 换取 openid → 创建/查找 user → 签发 JWT。
   */
  async login(userId: string): Promise<{ accessToken: string }> {
    const user = await this.prisma.client.user.findUnique({ where: { id: userId } });
    if (!user) {
      // 开发模式：自动注册不存在的用户
      const created = await this.prisma.client.user.create({
        data: { id: userId, nickname: '用户' },
      });
      await this.prisma.client.quota.create({
        data: { userId: created.id, permanentPoints: 1000, monthlyPoints: 100 },
      });
    }

    const payload = { userId };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwtSecret'),
      expiresIn: '7d',
    });
    return { accessToken };
  }
}
