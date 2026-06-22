import { Injectable, Logger } from '@nestjs/common';


export interface SendSmsOptions {
  phoneNumber: string;
  content: string;
  shortLink?: string;
}


@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async send(options: SendSmsOptions): Promise<boolean> {
    // 内测阶段：log-only，不接真实短信网关
    // 真机前需对接短信服务商（阿里云/腾讯云 SMS）
    this.logger.warn(
      `[SMS] would send to ${options.phoneNumber}: "${options.content}"${options.shortLink ? ` link=${options.shortLink}` : ''}`,
    );
    return true;
  }
}
