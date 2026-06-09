import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { TwilioSignatureGuard } from '../auth/guards/twilio-signature.guard';
import { SharingService } from './sharing.service';

@Controller('webhooks/twilio')
export class SharingWebhookController {
  constructor(private readonly sharingService: SharingService) {}

  @Post('status')
  @SkipThrottle()
  @UseGuards(TwilioSignatureGuard)
  @HttpCode(204)
  async twilioStatus(@Body() body: Record<string, string>) {
    const { MessageSid, MessageStatus } = body;
    if (!MessageSid) return;
    if (MessageStatus === 'delivered') {
      await this.sharingService.markDelivered(MessageSid);
    } else if (['failed', 'undelivered'].includes(MessageStatus)) {
      await this.sharingService.markFailed(MessageSid, MessageStatus);
    }
  }
}
