/**
 * 应用配置（从 env 读，强类型）。
 *
 * 通过 `ConfigService.get<AppConfig>()` 在 service 中使用。
 */
export interface AppConfig {
  /** 运行环境：development | production | test */
  nodeEnv: string;
  /** HTTP 监听端口 */
  port: number;
  /** PostgreSQL 连接串（Prisma 用） */
  databaseUrl: string;
  /** 微信小程序凭证（M2 code2Session 用） */
  wechat: {
    appid: string;
    secret: string;
  };
  /** MiniMax M3 凭证（M2-A LLM 代理用） */
  minimax: {
    apiKey: string;
    baseUrl: string;
  };
  /** AES-256-GCM 加密密钥（64 hex = 32 bytes；默认全 0 兜底，生产必须覆盖） */
  encryptionKey: string;
  /** JWT 签名密钥 */
  jwtSecret: string;
}

/**
 * ConfigModule 的配置工厂。
 *
 * 字段缺失时取空字符串占位（避免 `.env.example` 空值导致启动失败）。
 */
export const configuration = (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '7777', 10),
  databaseUrl: process.env.DATABASE_URL ?? '',
  wechat: {
    appid: process.env.WECHAT_APPID ?? '',
    secret: process.env.WECHAT_SECRET ?? '',
  },
  minimax: {
    apiKey: process.env.MINIMAX_API_KEY ?? '',
    baseUrl: process.env.MINIMAX_BASE_URL ?? '',
  },
  encryptionKey:
    process.env.ENCRYPTION_KEY ??
    '0000000000000000000000000000000000000000000000000000000000000000',
  jwtSecret: process.env.JWT_SECRET ?? 'timeslots-dev-jwt-secret',
});
