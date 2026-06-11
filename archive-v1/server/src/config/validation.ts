import * as Joi from 'joi';

/**
 * 环境变量 Joi 校验 schema。
 *
 * **关键修复**：
 * - 字符串字段统一 `.allow('').optional()`，禁止 `.optional()` 直接放（空字符串会拒）
 * - 数字字段 `Joi.number().port().default(7777)` 不受此影响
 *
 * @see AGENTS §5.3.3 #11
 */
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(7777),
  DATABASE_URL: Joi.string().allow('').optional(),
  WECHAT_APPID: Joi.string().allow('').optional(),
  WECHAT_SECRET: Joi.string().allow('').optional(),
  MINIMAX_API_KEY: Joi.string().allow('').optional(),
  MINIMAX_BASE_URL: Joi.string().uri().allow('').optional(),
  JWT_SECRET: Joi.string().allow('').optional().default('timeslots-dev-jwt-secret'),
  ENCRYPTION_KEY: Joi.string()
    .allow('')
    .optional()
    .default('0000000000000000000000000000000000000000000000000000000000000000'),
});
