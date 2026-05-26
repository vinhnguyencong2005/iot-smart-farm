import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SensorLog, SensorLogDocument } from '../schemas/sensor-log.schema';

@Controller('monitor')
export class MonitorController {
  constructor(
    @InjectModel(SensorLog.name) private sensorLogModel: Model<SensorLogDocument>,
  ) {}

  @Get('telemetry/:deviceId')
  async getRecentTelemetry(
    @Param('deviceId') deviceId: string,
    @Query('limit') limit = 50,
  ) {
    return this.sensorLogModel
      .find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .exec();
  }
}