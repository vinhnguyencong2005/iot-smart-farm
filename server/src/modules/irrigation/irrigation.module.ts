import { Module } from '@nestjs/common';
import { IrrigationController } from './irrigation.controller';
import { AutomationService } from './services/automation.service';
import { CommandService } from './services/command.service';
import { IrrigationRepository } from './irrigation.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { PumpLog, PumpLogSchema } from './schemas/pump-log.schema';
import { PumpConfig, PumpConfigSchema } from './schemas/pump-config.schema';

@Module({
  providers: [AutomationService, IrrigationRepository, CommandService],
  controllers: [IrrigationController],
  imports: [
    MongooseModule.forFeature([
      { name: PumpLog.name, schema: PumpLogSchema },
      { name: PumpConfig.name, schema: PumpConfigSchema },
    ]),
  ],
})
export class IrrigationModule {}
