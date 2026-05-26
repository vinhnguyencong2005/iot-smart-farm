import { Module } from '@nestjs/common';
import { AnalyticController } from './analytic.controller';

@Module({
  controllers: [AnalyticController],
})
export class AnalyticModule {}
