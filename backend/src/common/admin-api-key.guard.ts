import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(AdminApiKeyGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('ADMIN_API_KEY');

    if (!expected || expected.trim().length < 32) {
      this.logger.error(
        'ADMIN_API_KEY missing or shorter than 32 chars — rejecting all admin requests',
      );
      throw new ServiceUnavailableException('Admin API not configured');
    }

    const req = context.switchToHttp().getRequest();
    const provided = req.headers['x-admin-api-key'];

    if (typeof provided !== 'string' || !this.safeEqual(provided, expected)) {
      throw new UnauthorizedException();
    }
    return true;
  }

  private safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  }
}
