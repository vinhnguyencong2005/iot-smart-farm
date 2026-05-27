import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AlertLog, AlertLogDocument } from '../schemas/alert-log.schema';
import { SensorAlertEvent } from '../../mqtt-client/events/sensor-alert.event';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    @InjectModel(AlertLog.name) 
    private readonly alertLogModel: Model<AlertLogDocument>,
  ) {}

  @OnEvent('monitor.sensor.alert', { async: true })
  async handleSensorAlert(payload: SensorAlertEvent) {
    const { deviceId, violations } = payload;

    this.logger.log(
      `[ALERT-SUBSCRIBER] Nhận tín hiệu xử lý ${violations.length} cảnh báo cho Device ID: ${deviceId}`,
    );

    try {
      const savePromises = violations.map((violation) => {
        return this.alertLogModel.create({
          device_id: deviceId,
          sensor_log_id: null,
          sensor_type: violation.sensor_type,
          value: violation.value,
          status: violation.status,
          message: violation.message,
          type: 'ENV',
          timestamp: new Date(),
        });
      });

      const savedDocs = await Promise.all(savePromises);
      
      this.logger.log(
        `[DB-SUCCESS] Successfully saved ${savedDocs.length} alert documents into MongoDB!`,
      );
    } catch (error: any) {
      this.logger.error(
        `[DB-ERROR] Failed to write alert logs to DB: ${error.message}`,
      );
    }
  }
  async getAlerts(query: {
    deviceId?: string;
    startDate?: string; 
    endDate?: string;   
    page?: number;
    limit?: number;
  }) {
    const { deviceId, startDate, endDate, page = 1, limit = 20 } = query;
    const filter: any = {};

    if (deviceId) {
      filter.device_id = deviceId;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate); 
      if (endDate) filter.timestamp.$lte = new Date(endDate); 
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.alertLogModel
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .exec(),
      this.alertLogModel.countDocuments(filter).exec(),
    ]);

    return {
      meta: {
        totalItems: total,
        itemCount: data.length,
        itemsPerPage: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
      },
      data,
    };
  }


}