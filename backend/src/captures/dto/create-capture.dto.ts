import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

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
  @IsIn(ALLOWED_CONTENT_TYPES)
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
