import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SensorLog, SensorLogDocument } from './schemas/sensor-log.schema';
import {
  SensorConfig,
  SensorConfigDocument,
} from './schemas/sensor-config.schema';
import { EnvironmentDto } from './dto/environment.dto';
import { isErrorCode } from '../../common/utils/type-guards.util';

@Injectable()
export class EnvironmentRepository {
  private readonly logger = new Logger(EnvironmentRepository.name);

  constructor(
    @InjectModel(SensorLog.name)
    private sensorLogModel: Model<SensorLogDocument>,

    @InjectModel(SensorConfig.name)
    private sensorConfigModel: Model<SensorConfigDocument>,

    private eventEmitter: EventEmitter2,
  ) {}

  async saveCleanTelemetry(
    environmentDto: EnvironmentDto,
  ): Promise<SensorLogDocument | null> {
    try {
      this.logger.debug(
        `[${environmentDto.traceId}] Saving cleaned environment data.`,
      );

      const newLog = new this.sensorLogModel(environmentDto);
      const savedLog = await newLog.save();

      this.eventEmitter.emit('CLEAN_ENVIRONMENT_DATA_SAVED', savedLog);

      this.logger.debug(
        `[${environmentDto.traceId}] Cleaned environment data saved successfully.`,
      );

      return savedLog;
    } catch (error) {
      // Handle duplicate key error (e.g., unique index violation)
      if (isErrorCode(error) && error.code === 11000) {
        this.logger.warn(
          `[${environmentDto.traceId}] Duplicate entry detected for device_id and timestamp.`,
        );
        return null;
      }

      // Log unexpected errors
      this.logger.error(
        `[${environmentDto.traceId}] Error occurred while saving cleaned environment data.`,
        error,
      );
      throw error;
    }
  }

  async getSensorConfig(
    deviceId: string,
  ): Promise<SensorConfigDocument | null> {
    try {
      return await this.sensorConfigModel
        .findOne({ device_id: new Types.ObjectId(deviceId) })
        .exec();
    } catch (error) {
      this.logger.error(`[${deviceId}] Error fetching sensor config:`, error);
      throw error;
    }
  }
}
