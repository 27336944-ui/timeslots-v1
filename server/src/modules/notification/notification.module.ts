import { Global, Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SmsService } from './sms.service';
import { WxAccessTokenService } from './wx-access-token.service';


@Global()
@Module({
  providers: [NotificationService, SmsService, WxAccessTokenService],
  exports: [NotificationService, SmsService, WxAccessTokenService],
})
export class NotificationModule {}
