import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { GlobalStateService } from '../../global-state/services/global-state.service';
import { RawEsp32Payload } from '../interfaces/raw-esp32-payload.interface';
import { CleanedDataEvent } from '../events/cleaned-data.event';

@Injectable()
export class DataCleanerService {
  private readonly logger = new Logger(DataCleanerService.name);

  constructor(
    private readonly globalState: GlobalStateService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  public processIncomingTelemetry(payload: Buffer) {
    try {
      const rawData: RawEsp32Payload =
        (JSON.parse(payload.toString()) as RawEsp32Payload) ?? {};

      if (!rawData.mac || !rawData.data) {
        this.logger.warn(
          'Received malformed payload (missing mac or data). Dropping.',
        );
        return;
      }

      // Check the Global RAM Cache for the Logical ID
      const deviceId = this.globalState.getDeviceIdFromMac(
        rawData.mac.toUpperCase(),
      );

      if (!deviceId) {
        this.logger.warn(
          `Unauthorized MAC address (${rawData.mac}). Payload dropped.`,
        );
        return;
      }

      // Instantiate the strongly-typed class event
      const event = new CleanedDataEvent(
        deviceId,
        rawData.mac.toUpperCase(),
        new Date(),
        rawData.data,
      );

      // Broadcast to the rest of the backend
      this.eventEmitter.emit('mqtt-client.dataCleaned', event);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to parse telemetry payload: ${message}`);
    }
  }
}
