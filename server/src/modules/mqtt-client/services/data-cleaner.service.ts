import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { GlobalStateService } from '../../global-state/services/global-state.service';
import { RawEsp32Payload } from '../interfaces/raw-esp32-payload.interface';
import { CleanedDataEvent } from '../events/cleaned-data.event';
import { SensorAlertEvent } from '../events/sensor-alert.event';
import { DeviceRepository } from '../../device/repositories/device.repository';
import { TriggerCondition, SensorType } from '../../device/enums/config.enums'; 

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

      if (device && device.sensorConfigs) {
        const configs = device.sensorConfigs as any;
        const violations: any[] = [];

        const soilConfig = configs[SensorType.SOIL_MOISTURE];
        const tempConfig = configs[SensorType.TEMPERATURE];
        const humidConfig = configs[SensorType.HUMIDITY];
        const lightConfig = configs[SensorType.LIGHT_LEVEL];

        if (soilConfig && soil !== undefined) {
          const min = Number(soilConfig.minThreshold);
          const max = Number(soilConfig.maxThreshold);
          const currentSoil = Number(soil);

          if (currentSoil < min) {
            violations.push({ sensor_type: 'soil_moisture', value: currentSoil, status: 'low', message: 'Soil moisture too low' });
          }
          if (currentSoil > max) {
            violations.push({ sensor_type: 'soil_moisture', value: currentSoil, status: 'high', message: 'Soil moisture too high' });
          }
        }

        if (tempConfig && temp !== undefined) {
          const min = Number(tempConfig.minThreshold);
          const max = Number(tempConfig.maxThreshold);
          const currentTemp = Number(temp);

          if (currentTemp < min) {
            violations.push({ sensor_type: 'temperature', value: currentTemp, status: 'low', message: 'Temperature too low' });
          }
          if (currentTemp > max) {
            violations.push({ sensor_type: 'temperature', value: currentTemp, status: 'high', message: 'Temperature too high' });
          }
        }

        if (humidConfig && humid !== undefined) {
          const min = Number(humidConfig.minThreshold);
          const max = Number(humidConfig.maxThreshold);
          const currentHumid = Number(humid);

          if (currentHumid < min) {
            violations.push({ sensor_type: 'humidity', value: currentHumid, status: 'low', message: 'Humidity too low' });
          }
          if (currentHumid > max) {
            violations.push({ sensor_type: 'humidity', value: currentHumid, status: 'high', message: 'Humidity too high' });
          }
        }

        if (lightConfig && light !== undefined) {
          const min = Number(lightConfig.minThreshold);
          const max = Number(lightConfig.maxThreshold);
          const currentLight = Number(light);

          if (currentLight < min) {
            violations.push({ sensor_type: 'light_level', value: currentLight, status: 'low', message: 'Light too low' });
          }
          if (currentLight > max) {
            violations.push({ sensor_type: 'light_level', value: currentLight, status: 'high', message: 'Light too high' });
          }
        }

        if (violations.length > 0) {
          this.logger.log(
            `[EVENT-EMIT] Detected ${violations.length} violations at device ${device.name}. Emitting event to AlertService...`
          );

          this.eventEmitter.emit(
            'monitor.sensor.alert',
            new SensorAlertEvent(deviceId, violations),
          );
        }
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to parse telemetry payload: ${message}`);
    }
  }
}