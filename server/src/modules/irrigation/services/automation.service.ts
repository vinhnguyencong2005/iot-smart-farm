import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EnvironmentDto } from '../../environment/dto/environment.dto';
import { EnvironmentRepository } from '../../environment/environment.repository';
import { SensorConfigDocument } from '../../environment/schemas/sensor-config.schema';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  private deviceConfigurations: Map<string, SensorConfigDocument> = new Map();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly environmentRepository: EnvironmentRepository,
  ) {}

  @OnEvent('CLEAN_ENVIRONMENT_DATA_SAVED')
  async evaluateIrrigationNeeds(cleanedData: EnvironmentDto) {
    const { device_id, soil_moisture, traceId } = cleanedData;

    this.logger.debug(
      `[${traceId}] Evaluating irrigation needs for device ${device_id}`,
    );

    if (!this.deviceConfigurations.has(device_id)) {
      const config =
        await this.environmentRepository.getSensorConfig(device_id);

      if (!config) {
        this.logger.warn(
          `[${traceId}] No sensor config found for device ${device_id}. Skipping automation.`,
        );
        return;
      }

      this.deviceConfigurations.set(device_id, config);
    }

    const config = this.deviceConfigurations.get(device_id)!;

    if (
      config.soil_moisture.enabled &&
      soil_moisture < config.soil_moisture.min
    ) {
      this.logger.log(
        `[${traceId}] Soil moisture (${soil_moisture}) dropped below minimum (${config.soil_moisture.min}). Emitting IRRIGATION_NEEDED event.`,
      );

      this.eventEmitter.emit('IRRIGATION_NEEDED', {
        device_id,
        traceId,
        soil_moisture, // Passed so the command service knows WHY it fired
      });
    }
  }

  @OnEvent('SENSOR_CONFIG_UPDATED')
  clearCache(deviceId: string) {
    this.logger.log(`Clearing cached configuration for device: ${deviceId}`);
    this.deviceConfigurations.delete(deviceId);
  }
}
