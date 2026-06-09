import { Body, Controller, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { DeviceTokenGuard } from '../auth/guards/device-token.guard';
import { CapturesService } from './captures.service';
import { CompleteCaptureDto, CreateCaptureDto } from './dto/create-capture.dto';

@Controller('captures')
@UseGuards(DeviceTokenGuard)
export class CapturesController {
  constructor(private readonly capturesService: CapturesService) {}

  @Post()
  create(@Headers('authorization') auth: string, @Body() dto: CreateCaptureDto) {
    return this.capturesService.create(auth, dto);
  }

  @Post(':captureId/complete')
  complete(
    @Headers('authorization') auth: string,
    @Param('captureId') captureId: string,
    @Body() dto: CompleteCaptureDto,
  ) {
    return this.capturesService.complete(auth, captureId, dto);
  }
}
