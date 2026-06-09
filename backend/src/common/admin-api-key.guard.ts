import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const configured = process.env.ADMIN_API_KEY;
    if (!configured) return true;
    const header = request.headers['x-admin-api-key'];
    if (header !== configured) throw new UnauthorizedException('Invalid admin API key');
    return true;
  }
}
