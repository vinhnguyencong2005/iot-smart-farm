import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PumpLog, PumpLogDocument } from './schemas/pump-log.schema';
import { PumpConfig, PumpConfigDocument } from './schemas/pump-config.schema';
import { PumpStatus } from './enums/pump.enums';
import { PumpLogDto } from './dto/pump-log.dto';

@Injectable()
export class IrrigationRepository {
  private readonly logger = new Logger(IrrigationRepository.name);

  constructor(
    @InjectModel(PumpLog.name) private pumpLogModel: Model<PumpLogDocument>,
    @InjectModel(PumpConfig.name)
    private pumpConfigModel: Model<PumpConfigDocument>,
  ) {}

  /**
   * Fetches the most recent successful pump activation for a specific device.
   * Used by the CommandService to calculate hardware cooldowns.
   */
  async getLastPumpAction(deviceId: string): Promise<PumpLogDocument | null> {
    return this.pumpLogModel
      .findOne({
        device_id: new Types.ObjectId(deviceId),
        status: PumpStatus.SUCCESS,
      })
      .sort({ timestamp: -1 }) // Sort descending to get the newest record first
      .exec();
  }

  /**
   * Saves a record of the pump activating (Audit Trail)
   */
  async logPumpAction(data: PumpLogDto): Promise<PumpLogDocument> {
    const newLog = new this.pumpLogModel({
      traceId: data.traceId,
      device_id: new Types.ObjectId(data.device_id),
      trigger_source: data.source, // Mapping from DTO to schema property name
      status: data.status,
      duration: data.duration,
      timestamp: data.timestamp,
    });

    return newLog.save();
  }

  /**
   * (Optional) Fetch pump config.
   * You'll use this later if you move the cooldown/duration settings to the DB.
   */
  async getPumpConfig(deviceId: string): Promise<PumpConfigDocument | null> {
    return this.pumpConfigModel
      .findOne({ device_id: new Types.ObjectId(deviceId) })
      .exec();
  }
}
