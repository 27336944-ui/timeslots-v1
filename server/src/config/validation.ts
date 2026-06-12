
import * as Joi from 'joi';


export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  APP_PORT: Joi.number().port().default(7777),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  WX_APPID: Joi.string().allow('').optional(),
  WX_SECRET: Joi.string().allow('').optional(),
});
