import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { SensorLog, SensorLogDocument } from '../schemas/sensor-log.schema';
import { PumpLog, PumpLogDocument } from '../schemas/pump-log.schema';
import { CleanedDataEvent } from '../../mqtt-client/events/cleaned-data.event';
import { GlobalStateService } from '../../global-state/services/global-state.service';
import { IrrigationCommandDispatchEvent } from '../../irrigation/events/irrigation.event'; // Import strongly-typed event

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
        mac: event.macAddress.toUpperCase(),
        data: event.readings,
        timestamp: event.timestamp || new Date(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to save sensor log: ${message}`);
    }
  }

  @OnEvent('irrigation.command.dispatch', { async: true })
  async handlePumpCommand(payload: IrrigationCommandDispatchEvent & { source?: string }) { 
    try {
      const macUpper = payload.macAddress.toUpperCase();
      const deviceId = this.globalState.getDeviceIdFromMac(macUpper);
      
      if (!deviceId) {
        this.logger.warn(`Could not find device ID for MAC: ${payload.macAddress} to save pump log.`);
        return;
      }

      const triggerSource = payload.source || 'AUTOMATION'; 

      await this.pumpLogModel.create({
        deviceId: deviceId,
        mac: macUpper,
        durationMs: payload.durationMs,
        source: triggerSource,
        timestamp: new Date(),
      });
      
      this.logger.log(`[MONITOR-DB] Saved ${triggerSource} pump log for device: ${deviceId} (${payload.durationMs}ms)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to save pump log: ${message}`);
    }
  }
}