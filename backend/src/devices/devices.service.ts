import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { Device } from './device.entity';

const TOKEN_TTL_DAYS = 90;
const MS_PER_DAY = 86_400_000;

@Injectable()
export class DevicesService implements OnModuleInit {
  constructor(
    @InjectRepository(Device) private readonly devices: Repository<Device>,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const code = this.config.get<string>('PAIRING_CODE');
    if (process.env.NODE_ENV === 'production' && code === 'WEDDING2025') {
      throw new Error('PAIRING_CODE must be changed from default in production');
    }
  }

  async pair(dto: {
    pairingCode: string;
    deviceName: string;
    deviceModel: string;
    appVersion?: string;
    osVersion?: string;
  }) {
    const expected = this.config.get<string>('PAIRING_CODE', 'WEDDING2025');
    if (dto.pairingCode !== expected) {
      throw new UnauthorizedException('Invalid pairing code');
    }
    const now = new Date();
    const accessToken = randomBytes(32).toString('hex');
    const device = this.devices.create({
      name: dto.deviceName,
      model: dto.deviceModel,
      accessToken,
      appVersion: dto.appVersion ?? null,
      osVersion: dto.osVersion ?? null,
      lastSeenAt: now,
      tokenIssuedAt: now,
      tokenExpiresAt: new Date(now.getTime() + TOKEN_TTL_DAYS * MS_PER_DAY),
      currentEventId: null,
    });
    const saved = await this.devices.save(device);
    return {
      deviceId: saved.id,
      accessToken: saved.accessToken,
      expiresAt: saved.tokenExpiresAt,
    };
  }

  async refreshToken(deviceId: string): Promise<{ accessToken: string; expiresAt: Date }> {
    const device = await this.devices.findOne({ where: { id: deviceId } });
    if (!device || device.revokedAt) {
      throw new UnauthorizedException('Invalid or revoked device token');
    }
    if (device.tokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Device token expired — re-pair the device');
    }
    const now = new Date();
    const accessToken = randomBytes(32).toString('hex');
    await this.devices.update(deviceId, {
      accessToken,
      tokenIssuedAt: now,
      tokenExpiresAt: new Date(now.getTime() + TOKEN_TTL_DAYS * MS_PER_DAY),
      lastSeenAt: now,
    });
    return {
      accessToken,
      expiresAt: new Date(now.getTime() + TOKEN_TTL_DAYS * MS_PER_DAY),
    };
  }

  async findByToken(token: string): Promise<Device | null> {
    const normalized = token.replace(/^Bearer\s+/i, '');
    return this.devices.findOne({ where: { accessToken: normalized } });
  }

  async touchLastSeen(deviceId: string): Promise<void> {
    await this.devices.update(deviceId, { lastSeenAt: new Date() });
  }

  async listAll(): Promise<Device[]> {
    return this.devices.find({ order: { createdAt: 'DESC' } });
  }

  async revoke(deviceId: string): Promise<void> {
    await this.devices.update(deviceId, { revokedAt: new Date() });
  }
}
