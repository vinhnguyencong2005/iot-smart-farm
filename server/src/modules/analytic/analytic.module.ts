import { Module } from '@nestjs/common';
import { AnalyticController } from './controllers/analytic.controller';
import { AnalyticService } from './services/analytic.service';
import { MonitorModule } from '../monitor/monitor.module';

@Module({
  imports: [
    MonitorModule
  ],
  controllers: [AnalyticController],
  providers: [AnalyticService]
})
export class AnalyticModule {}