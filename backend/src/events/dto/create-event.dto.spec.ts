import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateEventDto } from './create-event.dto';
import { CreateCaptureDto } from '../../captures/dto/create-capture.dto';
import { CreateShareDto } from '../../sharing/dto/create-share.dto';

describe('DTO validation', () => {
  it('rejects event name shorter than 3 characters', async () => {
    const dto = plainToInstance(CreateEventDto, { name: 'AB', config: {} });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejects capture with invalid UUID eventId', async () => {
    const dto = plainToInstance(CreateCaptureDto, {
      eventId: 'not-a-uuid',
      captureType: 'photo',
      idempotencyKey: '00000000-0000-4000-8000-000000000001',
      deviceId: '00000000-0000-4000-8000-000000000002',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects capture bytes over 50MB', async () => {
    const dto = plainToInstance(CreateCaptureDto, {
      eventId: '00000000-0000-4000-8000-000000000001',
      captureType: 'photo',
      idempotencyKey: '00000000-0000-4000-8000-000000000002',
      deviceId: '00000000-0000-4000-8000-000000000003',
      bytes: 60_000_000,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'bytes')).toBe(true);
  });

  it('rejects share with invalid channel', async () => {
    const dto = plainToInstance(CreateShareDto, {
      captureId: '00000000-0000-4000-8000-000000000001',
      channel: 'INVALID',
      idempotencyKey: '00000000-0000-4000-8000-000000000002',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'channel')).toBe(true);
  });

  it('accepts valid share dto', async () => {
    const dto = plainToInstance(CreateShareDto, {
      captureId: '00000000-0000-4000-8000-000000000001',
      channel: 'sms',
      idempotencyKey: '00000000-0000-4000-8000-000000000002',
      destination: '+15551234567',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
