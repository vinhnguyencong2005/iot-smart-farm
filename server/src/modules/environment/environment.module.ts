import { Module } from '@nestjs/common';
import { EnvironmentRepository } from './environment.repository';
import { DataCleanerService } from './data-cleaner.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SensorLog, SensorLogSchema } from './schemas/sensor-log.schema';
import {
  SensorConfig,
  SensorConfigSchema,
} from './schemas/sensor-config.schema';
import { EnvironmentController } from './environment.controller';

@Module({
  providers: [EnvironmentRepository, DataCleanerService],
  imports: [
    MongooseModule.forFeature([
      { name: SensorLog.name, schema: SensorLogSchema },
      { name: SensorConfig.name, schema: SensorConfigSchema },
    ]),
  ],
  controllers: [EnvironmentController],
})
export class EnvironmentModule {}
