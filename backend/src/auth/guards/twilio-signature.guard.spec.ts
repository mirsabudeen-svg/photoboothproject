import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TwilioSignatureGuard } from './twilio-signature.guard';

describe('TwilioSignatureGuard', () => {
  let guard: TwilioSignatureGuard;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TwilioSignatureGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => (key === 'NODE_ENV' ? 'production' : undefined)),
            getOrThrow: jest.fn(() => 'test_auth_token'),
          },
        },
      ],
    }).compile();
    guard = module.get(TwilioSignatureGuard);
  });

  it('401 when signature header missing in production', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          protocol: 'https',
          get: () => 'example.com',
          originalUrl: '/api/v1/webhooks/twilio/status',
          body: {},
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('allows requests in non-production without signature', async () => {
    const module = await Test.createTestingModule({
      providers: [
        TwilioSignatureGuard,
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => 'test'), getOrThrow: jest.fn(() => 'token') },
        },
      ],
    }).compile();
    const devGuard = module.get(TwilioSignatureGuard);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {}, body: {} }),
      }),
    } as ExecutionContext;
    expect(devGuard.canActivate(context)).toBe(true);
  });
});
