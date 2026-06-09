import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

const CAPTURE_TYPES = [
  'photo',
  'photo_strip',
  'gif',
  'boomerang',
  'video',
  'slow_mo',
  'three_sixty',
  'dslr_photo',
  'PHOTO',
  'GIF',
  'BOOMERANG',
] as const;

export class CreateCaptureDto {
  @IsUUID()
  eventId: string;

  @IsEnum(CAPTURE_TYPES)
  captureType: string;

  @IsUUID()
  idempotencyKey: string;

  @IsUUID()
  deviceId: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50_000_000)
  bytes?: number;
}

export class CompleteCaptureDto {
  @IsString()
  idempotencyKey: string;

  @IsString()
  objectKey: string;
}
