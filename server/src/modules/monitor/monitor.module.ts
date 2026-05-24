import { Module } from '@nestjs/common';
import { MonitorController } from './controllers/monitor.controller';

@Module({
  controllers: [MonitorController]
})
export class MonitorModule {}
