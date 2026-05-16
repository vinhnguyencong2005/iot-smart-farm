import { Module } from '@nestjs/common';
import { IrrigationController } from './irrigation.controller';
import { AutomationService } from './services/automation.service';

@Module({
  providers: [AutomationService, IrrigationController],
})
export class IrrigationModule {}
