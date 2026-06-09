import { Controller, Post, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from '../common/admin-api-key.guard';
import { RetentionReport, RetentionService } from './retention.service';

@Controller('admin/retention')
export class RetentionController {
  constructor(private readonly retentionService: RetentionService) {}

  @Post('sweep')
  @UseGuards(AdminApiKeyGuard)
  triggerSweep(): Promise<RetentionReport> {
    return this.retentionService.runRetentionSweep();
  }
}
