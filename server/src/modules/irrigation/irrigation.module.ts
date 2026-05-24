import { Module } from '@nestjs/common';
import { IrrigationController } from './controllers/irrigation.controller';
import { IrrigationService } from './services/irrigation.service';
import { DeviceModule } from '../device/device.module'; // Required for DeviceRepository

@Module({
  imports: [DeviceModule],
  controllers: [IrrigationController],
  providers: [IrrigationService],
})
export class IrrigationModule {}
