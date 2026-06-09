import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DeviceTokenGuard } from './device-token.guard';
import { DevicesService } from '../../devices/devices.service';

describe('DeviceTokenGuard', () => {
  let guard: DeviceTokenGuard;
  const devicesService = {
    findByToken: jest.fn(),
    touchLastSeen: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DeviceTokenGuard,
        { provide: DevicesService, useValue: devicesService },
      ],
    }).compile();
    guard = module.get(DeviceTokenGuard);
    jest.clearAllMocks();
  });

  it('401 when Authorization header missing', async () => {
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }),
    } as ExecutionContext;
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('401 when token expired', async () => {
    devicesService.findByToken.mockResolvedValue({
      id: 'd1',
      revokedAt: null,
      tokenExpiresAt: new Date(Date.now() - 1000),
    });
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: 'Bearer abc' }, device: null }),
      }),
    } as ExecutionContext;
    await expect(guard.canActivate(context)).rejects.toThrow('expired');
  });

  it('passes with valid token', async () => {
    devicesService.findByToken.mockResolvedValue({
      id: 'd1',
      revokedAt: null,
      tokenExpiresAt: new Date(Date.now() + 86_400_000),
    });
    const request = { headers: { authorization: 'Bearer abc' }, device: null };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.device).toBeDefined();
  });
});
