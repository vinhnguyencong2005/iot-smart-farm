import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SensorLog, SensorLogDocument } from '../schemas/sensor-log.schema';
import { AlertService } from '../services/alert.service'; // Import AlertService

@Controller('monitor')
export class MonitorController {
  constructor(
    @InjectModel(SensorLog.name) private sensorLogModel: Model<SensorLogDocument>,
    private readonly alertService: AlertService,
  ) {}


  // GET /monitor/alerts?deviceId=xxx&isResolved=false&page=1&limit=20
  @Get('alerts')
  async getAllAlerts(
    @Query('deviceId') deviceId?: string,
    @Query('startDate') startDate?: string, 
    @Query('endDate') endDate?: string,    
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.alertService.getAlerts({ 
      deviceId, startDate, endDate, page, limit 
    });
  }
}