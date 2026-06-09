import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EventConfigDto {
  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  captureMode?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  consentText?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(['qr', 'sms', 'email', 'whatsapp'], { each: true })
  shareChannels?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  retentionDays?: number;

  @IsOptional()
  @IsString()
  hashtag?: string;
}

export class CreateEventDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  eventType?: string;

  @ValidateNested()
  @Type(() => EventConfigDto)
  config: EventConfigDto;
}
