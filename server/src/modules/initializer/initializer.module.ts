import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InitializerService } from './services/initializer.service';
import { InitializerRepository } from './repositories/initializer.repository';
import { Device, DeviceSchema } from '../device/schemas/device.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
  ],
  providers: [InitializerService, InitializerRepository],
})
export class InitializerModule {}
