import { Module, Global, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { GlobalStateService } from './services/global-state.service';
import { GlobalStateRepository } from './repositories/global-state.repository';
import { Device, DeviceSchema } from '../device/schemas/device.schema';

@Global() // <--- This makes the service available everywhere
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
  ],
  providers: [GlobalStateService, GlobalStateRepository, Logger],
  exports: [GlobalStateService], // Export it so others can use it
})
export class GlobalStateModule {}
