import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DevicesService } from './devices.service';
import { Device } from './device.entity';

describe('DevicesService', () => {
  let service: DevicesService;
  const repo = {
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => ({ ...v, id: 'device-1' })),
    findOne: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DevicesService,
        { provide: getRepositoryToken(Device), useValue: repo },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string, fallback?: string) => (key === 'PAIRING_CODE' ? 'TEST' : fallback)) },
        },
      ],
    }).compile();
    service = module.get(DevicesService);
    jest.clearAllMocks();
  });

  it('rejects invalid pairing code', async () => {
    await expect(
      service.pair({ pairingCode: 'WRONG', deviceName: 'A', deviceModel: 'B' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns token for valid pairing code', async () => {
    const result = await service.pair({ pairingCode: 'TEST', deviceName: 'A', deviceModel: 'B' });
    expect(result.accessToken).toHaveLength(64);
    expect(result.deviceId).toBe('device-1');
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it('refreshToken issues new access token', async () => {
    repo.findOne.mockResolvedValue({
      id: 'device-1',
      revokedAt: null,
      tokenExpiresAt: new Date(Date.now() + 86_400_000),
    });
    repo.update.mockResolvedValue(undefined);
    const result = await service.refreshToken('device-1');
    expect(result.accessToken).toHaveLength(64);
    expect(result.expiresAt).toBeDefined();
  });
});
