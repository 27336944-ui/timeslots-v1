import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * AES-256-GCM 加密负载结构。
 *
 * 索引签名 `[key: string]: string` 让它兼容 Prisma `InputJsonObject`（要求索引签名）。
 */
export interface EncryptedPayload {
  /** base64 编码的密文 */
  data: string;
  /** base64 编码的 12 字节 IV */
  iv: string;
  /** base64 编码的 16 字节 AuthTag */
  tag: string;
  /** 索引签名（Prisma Json 字段要求） */
  [key: string]: string;
}

/**
 * 端到端加密服务。
 *
 * 算法：AES-256-GCM（认证加密；12 字节 IV + 16 字节 AuthTag）。
 * 密钥来源：`ENCRYPTION_KEY` env（64 hex = 32 bytes）。
 *
 * 用途：服务端加密 `TimeBlock.encryptedDetails` 等隐私敏感字段。
 * 密钥绝不写入前端（AGENTS §5.3.3 #9 集中管控）。
 */
@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const keyHex = config.get<string>(
      'encryptionKey',
      '0000000000000000000000000000000000000000000000000000000000000000',
    );
    const keyBuf = Buffer.from(keyHex, 'hex');
    if (keyBuf.length !== 32) {
      throw new InternalServerErrorException(
        'ENCRYPTION_KEY 必须是 64 个十六进制字符（32 字节）',
      );
    }
    this.key = keyBuf;
  }

  /**
   * 加密字符串。
   *
   * @param plaintext - 明文字符串
   * @returns AES-256-GCM 负载（data/iv/tag 均为 base64）
   */
  encrypt(plaintext: string): EncryptedPayload {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      data: enc.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
    };
  }

  /**
   * 解密负载。
   *
   * @param payload - AES-256-GCM 负载
   * @returns 明文字符串
   */
  decrypt(payload: EncryptedPayload): string {
    const iv = Buffer.from(payload.iv, 'base64');
    const tag = Buffer.from(payload.tag, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([
      decipher.update(Buffer.from(payload.data, 'base64')),
      decipher.final(),
    ]);
    return dec.toString('utf8');
  }

  /**
   * 加密对象（JSON 序列化 → AES-256-GCM）。
   */
  encryptObject(obj: Record<string, unknown>): EncryptedPayload {
    return this.encrypt(JSON.stringify(obj));
  }

  /**
   * 解密为对象。
   */
  decryptObject<T extends Record<string, unknown>>(payload: EncryptedPayload): T {
    return JSON.parse(this.decrypt(payload)) as T;
  }
}
