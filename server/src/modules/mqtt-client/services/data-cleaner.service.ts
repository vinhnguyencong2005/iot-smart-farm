import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { GlobalStateService } from '../../global-state/services/global-state.service';
import { RawEsp32Payload } from '../interfaces/raw-esp32-payload.interface';
import { CleanedDataEvent } from '../events/cleaned-data.event';

import { DeviceRepository } from '../../device/repositories/device.repository';
import { TriggerCondition } from '../../device/enums/config.enums';

@Injectable()
export class DataCleanerService {
  private readonly logger = new Logger(DataCleanerService.name);

  constructor(
    private readonly deviceRepository: DeviceRepository,
    private readonly globalState: GlobalStateService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  public async processIncomingTelemetry(payload: Buffer) {
    try {
      const rawData: RawEsp32Payload =
        (JSON.parse(payload.toString()) as RawEsp32Payload) ?? {};

      if (!rawData.mac || !rawData.data) {
        this.logger.warn(
          'Received malformed payload (missing mac or data). Dropping.',
        );
        return;
      }

      const macUpper = rawData.mac.toUpperCase();

      const { soil, temp, humid, light } = rawData.data;

      const deviceId = this.globalState.getDeviceIdFromMac(macUpper);

      if (!deviceId) {
        this.logger.warn(
          `Unauthorized MAC address (${rawData.mac}). Payload dropped.`,
        );
        return;
      }

      const device = await this.deviceRepository.findDeviceByMacAddress(
        macUpper,
      );

      if (device && device.pumpConfig && device.pumpConfig.enabled) {
        const triggers = device.pumpConfig.trigger || []; 
        const logicalOperator = 'OR';

        const triggerResults = triggers.map((trigger) => {
          let currentReadingValue: number | undefined;

          if (trigger.type === 'soil') currentReadingValue = soil;
          if (trigger.type === 'temp') currentReadingValue = temp;
          if (trigger.type === 'humid') currentReadingValue = humid;
          if (trigger.type === 'light') currentReadingValue = light;

          if (currentReadingValue === undefined) return false;

          if (trigger.condition === TriggerCondition.LESS_THAN) {
            return currentReadingValue < trigger.value;
          }
          if (trigger.condition === TriggerCondition.GREATER_THAN) {
            return currentReadingValue > trigger.value;
          }
          if (trigger.condition === TriggerCondition.EQUAL) {
            return currentReadingValue === trigger.value;
          }
          return false;
        });

        let isTriggered = false;
      
        isTriggered = triggerResults.some((result) => result === true);
  

        // Bổ sung đoạn phát tín hiệu tưới bị khuyết
        if (isTriggered) {
          this.logger.log(
            `[AUTO-TRIG] Device ${device.name} met criteria via operator [${logicalOperator}]`,
          );

          this.eventEmitter.emit('irrigation.automation.trigger', {
            deviceId,
            deviceName: device.name,
          });
        }
      } 
      const event = new CleanedDataEvent(
        deviceId,
        macUpper,
        new Date(),
        rawData.data,
      );

      this.eventEmitter.emit('mqtt-client.dataCleaned', event);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Failed to parse telemetry payload: ${message}`,
      );
    }
  }
}