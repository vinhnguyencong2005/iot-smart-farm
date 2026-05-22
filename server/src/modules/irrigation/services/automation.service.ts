import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EnvironmentDto } from '../../environment/dto/environment.dto';
import { IrrigationRepository } from '../irrigation.repository';
import { PumpConfigDocument } from '../schemas/pump-config.schema';
import { CommandService } from './command.service';
import { TriggerSource, PumpCondition } from '../enums/pump.enums';
import { type PumpLogDto } from '../dto/pump-log.dto';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  // Cache updated to hold the PumpConfig instead of SensorConfig
  private pumpConfigurations: Map<string, PumpConfigDocument> = new Map();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly irrigationRepository: IrrigationRepository,
    private readonly commandService: CommandService,
  ) {}

  @OnEvent('CLEAN_ENVIRONMENT_DATA_SAVED')
  async evaluateIrrigationNeeds(cleanedData: EnvironmentDto) {
    const { device_id, traceId } = cleanedData;

    this.logger.debug(
      `[${traceId}] Evaluating irrigation needs for device ${device_id}`,
    );

    // Fetch from Cache or Database
    if (!this.pumpConfigurations.has(device_id)) {
      const config = await this.irrigationRepository.getPumpConfig(device_id);

      if (!config) {
        this.logger.warn(
          `[${traceId}] No pump config found for device ${device_id}. Skipping automation.`,
        );
        return;
      }

      this.pumpConfigurations.set(device_id, config);
    }

    const config = this.pumpConfigurations.get(device_id)!;

    // Master kill-switch check
    if (!config.enabled || !config.triggers || config.triggers.length === 0) {
      return;
    }

    let shouldWater = false;
    let triggerReason = '';

    // Dynamically evaluate every rule defined in the PumpConfig schema
    for (const trigger of config.triggers) {
      // Access the sensor value dynamically using the enum (e.g., cleanedData['soil_moisture'])
      const currentValue = cleanedData[trigger.type as keyof EnvironmentDto];

      // Type guard to ensure we are comparing numbers
      if (typeof currentValue !== 'number') continue;

      if (
        trigger.condition === PumpCondition.LESS_THAN &&
        currentValue < trigger.value
      ) {
        shouldWater = true;
        triggerReason = `${trigger.type} (${currentValue}) is LESS THAN ${trigger.value}`;
        break; // One triggered rule is enough to turn on the pump
      }

      if (
        trigger.condition === PumpCondition.GREATER_THAN &&
        currentValue > trigger.value
      ) {
        shouldWater = true;
        triggerReason = `${trigger.type} (${currentValue}) is GREATER THAN ${trigger.value}`;
        break;
      }
    }

    // Dispatch the command if a rule matched
    if (shouldWater) {
      this.logger.log(`[${traceId}] Automation triggered: ${triggerReason}`);

      this.eventEmitter.emit('IRRIGATION_NEEDED', {
        device_id,
        traceId,
        duration: config.duration, // Grab the duration directly from the schema!
      });
    }
  }

  // Clear cache if the user updates their pump rules in the UI
  @OnEvent('PUMP_CONFIG_UPDATED')
  clearCache(deviceId: string) {
    this.logger.log(
      `Clearing cached pump configuration for device: ${deviceId}`,
    );
    this.pumpConfigurations.delete(deviceId);
  }

  @OnEvent('IRRIGATION_NEEDED')
  async executeAutomation(payload: PumpLogDto) {
    try {
      await this.commandService.dispatchPumpCommand({
        device_id: payload.device_id,
        duration: payload.duration,
        source: TriggerSource.ENV,
        traceId: payload.traceId,
      } as PumpLogDto);
    } catch (error: any) {
      this.logger.warn(
        `[${payload.traceId}] Automated irrigation skipped: ${error}`,
      );
    }
  }
}
