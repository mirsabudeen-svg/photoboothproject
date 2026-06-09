import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateShareDto {
  @IsUUID()
  captureId: string;

  @IsEnum(['qr', 'sms', 'email', 'whatsapp', 'social', 'QR', 'SMS', 'EMAIL', 'WHATSAPP'])
  channel: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsString()
  idempotencyKey: string;
}
