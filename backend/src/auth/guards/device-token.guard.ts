import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { DevicesService } from '../../devices/devices.service';

@Injectable()
export class DeviceTokenGuard implements CanActivate {
  constructor(private readonly devicesService: DevicesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string = request.headers['authorization'] ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Device token required');
    }
    const token = authHeader.slice(7);
    const device = await this.devicesService.findByToken(token);
    if (!device) {
      throw new UnauthorizedException('Invalid device token');
    }
    if (device.revokedAt) {
      throw new UnauthorizedException('Device token revoked');
    }
    if (device.tokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Device token expired — re-pair the device');
    }
    this.devicesService.touchLastSeen(device.id).catch(() => {});
    request.device = device;
    return true;
  }
}
