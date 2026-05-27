import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MonitorController } from './controllers/monitor.controller';
import { MonitorPublisherService } from './services/monitor-publisher.service';
import { TelemetryStorageService } from './services/telemetry-storage.service';
import { AlertLog, AlertLogSchema } from './schemas/alert-log.schema';
import { AlertService } from './services/alert.service';
import { SensorLog, SensorLogSchema } from './schemas/sensor-log.schema';
import { PumpLog, PumpLogSchema } from './schemas/pump-log.schema';
import { GlobalStateModule } from '../global-state/global-state.module'; 
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SensorLog.name, schema: SensorLogSchema },
      { name: PumpLog.name, schema: PumpLogSchema },
      { name: AlertLog.name, schema: AlertLogSchema },
    ]),
    GlobalStateModule, 
  ],
  controllers: [MonitorController],
  providers: [
    MonitorPublisherService, 
    TelemetryStorageService,
    AlertService,
  ],
  exports: [
    MongooseModule 
  ]
})
export class MonitorModule {}