import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IrrigationRepository } from '../irrigation.repository';
import { TriggerSource, PumpStatus } from '../enums/pump.enums';

export interface PumpCommandPayload {
  device_id: string;
  duration_seconds: number;
  source: TriggerSource;
  traceId: string;
}

@Injectable()
export class CommandService {
  private readonly logger = new Logger(CommandService.name);

  // HARDWARE SAFETY: Prevent the pump from running more than once every 5 minutes
  private readonly COOLDOWN_MS = 5 * 60 * 1000;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly irrigationRepo: IrrigationRepository,
  ) {}

  async dispatchPumpCommand(payload: PumpCommandPayload): Promise<void> {
    const { device_id, duration_seconds, source, traceId } = payload;

    this.logger.log(
      `[${traceId}] Irrigation requested for device ${device_id} via ${source}`,
    );

    // 1. HARDWARE SAFETY: Cooldown Check
    const lastPumpLog = await this.irrigationRepo.getLastPumpAction(device_id);

    if (lastPumpLog) {
      const timeSinceLastRun = Date.now() - lastPumpLog.timestamp.getTime();

      if (timeSinceLastRun < this.COOLDOWN_MS) {
        const remainingCooldown = Math.round(
          (this.COOLDOWN_MS - timeSinceLastRun) / 1000,
        );
        this.logger.warn(
          `[${traceId}] Pump is on cooldown. Try again in ${remainingCooldown}s.`,
        );

        // If the user clicked the manual button, this throws a 409 Conflict error back to the UI
        throw new ConflictException(
          `Pump is on cooldown. Please wait ${remainingCooldown} seconds.`,
        );
      }
    }

    try {
      // 2. Log the action to MongoDB (Audit Trail)
      await this.irrigationRepo.logPumpAction({
        device_id,
        traceId,
        duration: duration_seconds,
        source: source,
        status: PumpStatus.SUCCESS,
        timestamp: new Date(),
      });

      // 3. Construct the payload for the ESP32 (e.g., "ON_120")
      // Your ESP32 C++ code should parse this string, turn on the relay, and delay()
      const physicalCommand = `ON_${duration_seconds}`;

      // 4. Send it to the MQTT Service to be broadcasted over the internet
      this.eventEmitter.emit('PUMP_CMD_DISPATCHED', {
        traceId,
        command: physicalCommand,
      });

      this.logger.log(`[${traceId}] Pump command dispatched successfully.`);
    } catch (error) {
      this.logger.error(`[${traceId}] Failed to execute pump command`, error);
      throw error;
    }
  }
}
