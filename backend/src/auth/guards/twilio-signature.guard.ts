import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { Request } from 'express';

@Injectable()
export class TwilioSignatureGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.config.get('NODE_ENV') !== 'production') {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const signature = request.headers['x-twilio-signature'];
    if (!signature || typeof signature !== 'string') {
      throw new UnauthorizedException('Missing Twilio signature');
    }
    const authToken = this.config.getOrThrow<string>('TWILIO_AUTH_TOKEN');
    const url = `${request.protocol}://${request.get('host')}${request.originalUrl}`;
    const valid = twilio.validateRequest(
      authToken,
      signature,
      url,
      request.body as Record<string, string>,
    );
    if (!valid) throw new UnauthorizedException('Invalid Twilio signature');
    return true;
  }
}
