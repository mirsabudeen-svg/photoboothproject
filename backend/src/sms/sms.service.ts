import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly client: ReturnType<typeof twilio> | null;

  constructor(private readonly config: ConfigService) {
    const sid = config.get<string>('TWILIO_ACCOUNT_SID');
    const token = config.get<string>('TWILIO_AUTH_TOKEN');
    this.client = sid && token ? twilio(sid, token) : null;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async send(to: string, body: string, mediaUrl?: string): Promise<string> {
    if (!this.client) {
      throw new BadRequestException('SMS service is not configured');
    }
    if (!/^\+[1-9]\d{7,14}$/.test(to)) {
      throw new BadRequestException(`Invalid phone number format: ${to}`);
    }
    const message = await this.client.messages.create({
      to,
      from: this.config.getOrThrow<string>('TWILIO_FROM_NUMBER'),
      body,
      ...(mediaUrl ? { mediaUrl: [mediaUrl] } : {}),
    });
    return message.sid;
  }
}
