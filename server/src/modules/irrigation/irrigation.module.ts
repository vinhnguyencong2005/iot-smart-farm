import { forwardRef, Module } from '@nestjs/common';
import { IrrigationController } from './controllers/irrigation.controller';
import { IrrigationService } from './services/irrigation.service';
import { DeviceModule } from '../device/device.module'; // Required for DeviceRepository
import { MqttClientModule } from '../mqtt-client/mqtt-client.module'; 
@Module({
  imports: [DeviceModule],
  controllers: [IrrigationController],
  providers: [IrrigationService],
  exports: [IrrigationService],
})
export class IrrigationModule {}
