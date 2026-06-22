
import * as Joi from 'joi';


export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  APP_PORT: Joi.number().port().default(7777),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  WX_APPID: Joi.string().allow('').optional(),
  WX_SECRET: Joi.string().allow('').optional(),
  MINIMAX_API_KEY: Joi.string().allow('').optional(),
  MINIMAX_BASE_URL: Joi.string().uri().allow('').optional().default('https://api.minimax.chat'),
  WX_TEMPLATE_REMINDER: Joi.string().allow('').optional(),
  WX_TEMPLATE_APPROVAL_INVITE: Joi.string().allow('').optional(),
  WX_TEMPLATE_APPROVAL_RESULT: Joi.string().allow('').optional(),
  WX_TEMPLATE_DELEGATION_REQUEST: Joi.string().allow('').optional(),
  WX_TEMPLATE_DELEGATION_COMPLETE: Joi.string().allow('').optional(),
  WX_TEMPLATE_STEP_UNLOCK: Joi.string().allow('').optional(),
  WX_TEMPLATE_WEEKLY_REPORT: Joi.string().allow('').optional(),
  SMS_SECRET_ID: Joi.string().allow('').optional(),
  SMS_SECRET_KEY: Joi.string().allow('').optional(),
  SMS_SIGN_NAME: Joi.string().allow('').optional(),
  GITAI_ENABLED: Joi.string().valid('true', 'false').default('true'),
});
