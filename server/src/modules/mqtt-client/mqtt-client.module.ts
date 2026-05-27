import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // <-- Nhớ import ConfigModule nha!

import { MqttConnectionService } from './services/mqtt-connection.service';
import { DataCleanerService } from './services/data-cleaner.service';
import { MqttPubSubService } from './services/mqtt-pubsub.service';

import { DeviceModule } from '../device/device.module'; 
import { IrrigationModule } from '../irrigation/irrigation.module'; 

@Module({
  imports: [
    ConfigModule, 
    DeviceModule,     
  ],
  providers: [
    MqttConnectionService, 
    DataCleanerService, 
    MqttPubSubService
  ],
  exports: [
    MqttPubSubService
  ],
})
export class MqttClientModule {}