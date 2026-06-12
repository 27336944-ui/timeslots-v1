import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ErrorCodes } from '../../common/exceptions/business-exception';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { WxLoginDto } from './dto/wx-login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { RestoreAccountDto } from './dto/restore-account.dto';


const GRACE_PERIOD_DAYS = 7;

const DEFAULT_SETTINGS = {
  dayStartsAt: '06:00',
  reminderLeadMinutes: 15,
  defaultNature: 'PUBLIC',
};


@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.prisma.client.user.findFirst({
      where: { id: dto.userId, isDeleted: false },
    });

    if (!user) {
      throw new BusinessException(ErrorCodes.USER_NOT_FOUND, '用户不存在', HttpStatus.UNAUTHORIZED);
    }

    this.checkDeletedUser(user);

    return this.buildLoginResponse(user);
  }

  async wxLogin(dto: WxLoginDto): Promise<LoginResponseDto> {
    const appid = this.configService.get<string>('WX_APPID');
    const secret = this.configService.get<string>('WX_SECRET');

    if (!appid || !secret || appid === 'your_wechat_appid_here') {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '微信登录未配置，请使用 Dev 登录');
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${dto.code}&grant_type=authorization_code`;

    let openid: string;
    try {
      const body = await this.httpsGet(url);
      if (body.errcode) {
        throw new BusinessException(ErrorCodes.VALIDATION_FAILED, `微信登录失败: ${body.errmsg || body.errcode}`);
      }
      openid = body.openid as string;
    } catch (e) {
      if (e instanceof BusinessException) throw e;
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '微信登录服务不可用');
    }

    let user = await this.prisma.client.user.findFirst({
      where: { openid, isDeleted: false },
    });

    if (user) {
      this.checkDeletedUser(user);
    } else {
      user = await this.prisma.client.user.create({
        data: { openid, nickname: '微信用户' },
      });
    }

    return this.buildLoginResponse(user);
  }

  async deleteAccount(userId: string): Promise<{ deleted: boolean; restoreToken: string }> {
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, isDeleted: false },
    });
    if (!user) {
      throw new BusinessException(ErrorCodes.USER_NOT_EXISTS, '用户不存在或已注销', HttpStatus.NOT_FOUND);
    }
    const restoreToken = randomUUID();
    await this.prisma.client.user.update({
      where: { id: userId },
      data: { isDeleted: true, deletedAt: new Date(), restoreToken },
    });
    return { deleted: true, restoreToken };
  }

  async restoreAccount(dto: RestoreAccountDto): Promise<LoginResponseDto> {
    const user = await this.prisma.client.user.findFirst({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new BusinessException(ErrorCodes.USER_NOT_EXISTS, '用户不存在', HttpStatus.NOT_FOUND);
    }
    if (!user.isDeleted || !user.deletedAt) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '账号未被注销，无需恢复');
    }
    if (user.restoreToken !== dto.restoreToken) {
      throw new BusinessException(ErrorCodes.RESTORE_TOKEN_INVALID, '恢复令牌无效', HttpStatus.FORBIDDEN);
    }
    const elapsed = Date.now() - user.deletedAt.getTime();
    if (elapsed > GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000) {
      throw new BusinessException(ErrorCodes.RESTORE_EXPIRED, '账号已超过 7 天冷静期，无法恢复', HttpStatus.FORBIDDEN);
    }
    await this.prisma.client.user.update({
      where: { id: dto.userId },
      data: { isDeleted: false, deletedAt: null, restoreToken: null },
    });
    return this.buildLoginResponse(user);
  }

  async migrateDevData(userId: string, devUserId: string): Promise<{ migrated: number }> {
    const blockCount = await this.prisma.client.timeBlock.count({
      where: { userId: devUserId, isDeleted: false },
    });
    const taskCount = await this.prisma.client.task.count({
      where: { userId: devUserId, isDeleted: false },
    });

    if (blockCount === 0 && taskCount === 0) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '未找到可迁移的 Dev 数据');
    }

    if (blockCount > 0) {
      await this.prisma.client.timeBlock.updateMany({
        where: { userId: devUserId, isDeleted: false },
        data: { userId },
      });
    }
    if (taskCount > 0) {
      await this.prisma.client.task.updateMany({
        where: { userId: devUserId, isDeleted: false },
        data: { userId },
      });
    }

    return { migrated: blockCount + taskCount };
  }

  async deleteDevData(userId: string, devUserId: string): Promise<{ deleted: number }> {
    if (userId === devUserId) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '不能通过此接口删除自己的数据');
    }
    const blockCount = await this.prisma.client.timeBlock.count({
      where: { userId: devUserId, isDeleted: false },
    });
    const taskCount = await this.prisma.client.task.count({
      where: { userId: devUserId, isDeleted: false },
    });

    if (blockCount === 0 && taskCount === 0) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '未找到可删除的 Dev 数据');
    }

    if (blockCount > 0) {
      await this.prisma.client.timeBlock.updateMany({
        where: { userId: devUserId, isDeleted: false },
        data: { isDeleted: true, deletedAt: new Date() },
      });
    }
    if (taskCount > 0) {
      await this.prisma.client.task.updateMany({
        where: { userId: devUserId, isDeleted: false },
        data: { isDeleted: true, deletedAt: new Date() },
      });
    }

    return { deleted: blockCount + taskCount };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<{ id: string; nickname: string; avatar: string | null }> {
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, isDeleted: false },
    });
    if (!user) {
      throw new BusinessException(ErrorCodes.USER_NOT_EXISTS, '用户不存在', HttpStatus.NOT_FOUND);
    }
    const updated = await this.prisma.client.user.update({
      where: { id: userId },
      data: {
        ...(dto.nickname !== undefined && { nickname: dto.nickname }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
      },
    });
    return { id: updated.id, nickname: updated.nickname, avatar: updated.avatar };
  }

  async getSettings(userId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, isDeleted: false },
    });
    if (!user) {
      throw new BusinessException(ErrorCodes.USER_NOT_EXISTS, '用户不存在', HttpStatus.NOT_FOUND);
    }
    const settings = (user.settings as Record<string, unknown>) || {};
    return { ...DEFAULT_SETTINGS, ...settings } as Record<string, unknown>;
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto): Promise<Record<string, unknown>> {
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, isDeleted: false },
    });
    if (!user) {
      throw new BusinessException(ErrorCodes.USER_NOT_EXISTS, '用户不存在', HttpStatus.NOT_FOUND);
    }
    const current = (user.settings as Record<string, unknown>) || {};
    const merged: Record<string, unknown> = { ...current };
    if (dto.dayStartsAt !== undefined) merged.dayStartsAt = dto.dayStartsAt;
    if (dto.reminderLeadMinutes !== undefined) merged.reminderLeadMinutes = dto.reminderLeadMinutes;
    if (dto.defaultNature !== undefined) merged.defaultNature = dto.defaultNature;
    await this.prisma.client.user.update({
      where: { id: userId },
      data: { settings: merged as Prisma.InputJsonValue },
    });
    return { ...DEFAULT_SETTINGS, ...merged } as Record<string, unknown>;
  }

  async validateUser(userId: string) {
    return this.prisma.client.user.findFirst({
      where: { id: userId, isDeleted: false },
    });
  }

  private checkDeletedUser(user: { isDeleted: boolean; deletedAt: Date | null }): void {
    if (!user.isDeleted || !user.deletedAt) return;
    const elapsed = Date.now() - user.deletedAt.getTime();
    if (elapsed > GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000) {
      throw new BusinessException(ErrorCodes.ACCOUNT_DELETED, '账号已永久删除，无法恢复', HttpStatus.FORBIDDEN);
    }
    throw new BusinessException(ErrorCodes.ACCOUNT_PENDING_DELETE, '账号待删除，请在 7 天内恢复账号后再登录', HttpStatus.FORBIDDEN);
  }

  private httpsGet(url: string): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch { reject(new Error('Invalid response from WeChat API')); }
        });
      }).on('error', reject);
    });
  }

  private buildLoginResponse(user: {
    id: string; nickname: string; avatar: string | null;
  }): LoginResponseDto {
    const payload = { sub: user.id, nickname: user.nickname };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: { id: user.id, nickname: user.nickname, avatar: user.avatar },
    };
  }
}
