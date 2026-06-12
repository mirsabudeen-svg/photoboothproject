import { ExecutionContext, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AdminApiKeyGuard } from './admin-api-key.guard';

const TEST_ADMIN_KEY = 'test-admin-api-key-32-chars-min!';

describe('AdminApiKeyGuard', () => {
  let guard: AdminApiKeyGuard;
  let configuredKey: string | undefined = TEST_ADMIN_KEY;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AdminApiKeyGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => configuredKey),
          },
        },
      ],
    }).compile();
    guard = module.get(AdminApiKeyGuard);
  });

  const contextWithHeader = (header?: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers: header != null ? { 'x-admin-api-key': header } : {} }),
      }),
    }) as ExecutionContext;

  it('503 when ADMIN_API_KEY is missing', () => {
    configuredKey = undefined;
    expect(() => guard.canActivate(contextWithHeader())).toThrow(ServiceUnavailableException);
  });

  it('503 when ADMIN_API_KEY is shorter than 32 chars', () => {
    configuredKey = 'too-short';
    expect(() => guard.canActivate(contextWithHeader())).toThrow(ServiceUnavailableException);
  });

  it('401 when header is missing', () => {
    configuredKey = TEST_ADMIN_KEY;
    expect(() => guard.canActivate(contextWithHeader())).toThrow(UnauthorizedException);
  });

  it('401 when header is wrong', () => {
    configuredKey = TEST_ADMIN_KEY;
    expect(() => guard.canActivate(contextWithHeader('wrong-key-wrong-key-wrong-key-wrong!'))).toThrow(
      UnauthorizedException,
    );
  });

  it('allows request with valid key', () => {
    configuredKey = TEST_ADMIN_KEY;
    expect(guard.canActivate(contextWithHeader(TEST_ADMIN_KEY))).toBe(true);
  });
});
