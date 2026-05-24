import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeviceController } from './controllers/device.controller';
import { DeviceRepository } from './repositories/device.repository';
import { Device, DeviceSchema } from './schemas/device.schema';
import { LookupDeviceService } from './services/lookup-device.service';
import { UpdateConfigService } from './services/update-config.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
  ],
  controllers: [DeviceController],
  providers: [
    LookupDeviceService,
    UpdateConfigService,
    DeviceRepository,
    Logger,
  ],
  exports: [DeviceRepository],
})
export class DeviceModule {}
