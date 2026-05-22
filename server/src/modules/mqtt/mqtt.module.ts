import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { DeviceRepository } from '../hardware/repositories/device.repository';
import { Device, DeviceSchema } from '../hardware/schemas/device.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Module({
  providers: [MqttService, DeviceRepository, ConfigService, EventEmitter2],
  imports: [
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
  ],
})
export class MqttModule {}
