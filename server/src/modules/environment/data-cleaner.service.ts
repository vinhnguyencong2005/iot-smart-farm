import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EnvironmentRepository } from './environment.repository';
import { EnvironmentDto } from './dto/environment.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class DataCleanerService {
  private readonly logger = new Logger(DataCleanerService.name);
  constructor(private readonly environmentRepository: EnvironmentRepository) {}

  @OnEvent('RAW_MQTT_RECEIVED')
  async handleRawData(rawPayload: Record<string, unknown>) {
    this.logger.log('Cleaning raw MQTT data...');

    const traceId: string =
      (rawPayload.traceId as string) || 'unknown-trace-id';
    this.logger.debug(`[${traceId}] Cleaning environment data.`);

    const environmentDto = plainToInstance(EnvironmentDto, rawPayload);
    const error = await validate(environmentDto);

    if (error.length > 0) {
      this.logger.error(`[${traceId}] Invalid environment payload: `, error);
      return;
    }

    try {
      this.logger.debug(
        `[${traceId}] Data validated successfully. Handing off to Repository...`,
      );

      await this.environmentRepository.saveCleanTelemetry(environmentDto);
    } catch (error) {
      this.logger.error(
        `[${traceId}] Failed to save cleaned environment data: `,
        error,
      );
    }
  }
}
