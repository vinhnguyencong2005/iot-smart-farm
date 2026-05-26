import { Module } from '@nestjs/common';
import { MqttConnectionService } from './services/mqtt-connection.service';
import { DataCleanerService } from './services/data-cleaner.service';
import { MqttPubSubService } from './services/mqtt-pubsub.service';

@Module({
  providers: [MqttConnectionService, DataCleanerService, MqttPubSubService],
  // Export pub-sub or connection if other modules need direct MQTT access later
  exports: [MqttPubSubService],
})
export class MqttClientModule {}
