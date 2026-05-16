import { Module } from '@nestjs/common';
import { SensorPublisherService } from './sensor-publisher.service';

@Module({
  providers: [SensorPublisherService],
})
export class MonitorModule {}
