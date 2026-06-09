import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';

describe('SmsService', () => {
  const config = {
    get: jest.fn(),
    getOrThrow: jest.fn((key: string) => {
      if (key === 'TWILIO_FROM_NUMBER') return '+15551234567';
      throw new Error(`Missing ${key}`);
    }),
  } as unknown as ConfigService;

  it('rejects invalid E.164 numbers', async () => {
    const service = new SmsService(config);
    await expect(service.send('5551234567', 'hello')).rejects.toBeInstanceOf(BadRequestException);
  });
});
