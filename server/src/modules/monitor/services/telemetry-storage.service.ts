import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { SensorLog, SensorLogDocument } from '../schemas/sensor-log.schema';
import { PumpLog, PumpLogDocument } from '../schemas/pump-log.schema';
import { CleanedDataEvent } from '../../mqtt-client/events/cleaned-data.event';
import { GlobalStateService } from '../../global-state/services/global-state.service';

@Injectable()
export class TelemetryStorageService {
  private readonly logger = new Logger(TelemetryStorageService.name);

  constructor(
    @InjectModel(SensorLog.name) private sensorLogModel: Model<SensorLogDocument>,
    @InjectModel(PumpLog.name) private pumpLogModel: Model<PumpLogDocument>,
    private readonly globalState: GlobalStateService,
  ) {}

  @OnEvent('mqtt-client.dataCleaned', { async: true })
  async handleSensorData(event: CleanedDataEvent) {
    try {
      await this.sensorLogModel.create({
        deviceId: event.deviceId,
        mac: event.macAddress,
        data: event.readings,
        timestamp: event.timestamp || new Date(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to save sensor log: ${message}`);
    }
  }

  @OnEvent('irrigation.command.dispatch', { async: true })
  async handlePumpCommand(payload: { macAddress: string; durationMs: number; source?: string }) {
    try {
      const deviceId = this.globalState.getDeviceIdFromMac(payload.macAddress);
      
      if (!deviceId) {
        this.logger.warn(`Could not find device ID for MAC: ${payload.macAddress} to save pump log.`);
        return;
      }

      await this.pumpLogModel.create({
        deviceId: deviceId,
        mac: payload.macAddress,
        durationMs: payload.durationMs,
        source: payload.source || 'MANUAL',
        timestamp: new Date(),
      });
      this.logger.log(`Saved pump log for device: ${deviceId} (${payload.durationMs}ms)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to save pump log: ${message}`);
    }
  }
}