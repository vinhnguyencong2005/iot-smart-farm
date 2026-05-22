import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { IrrigationRepository } from '../irrigation.repository';
import { PumpStatus } from '../enums/pump.enums';
import { PumpLogDto } from '../dto/pump-log.dto';

@Injectable()
export class CommandService {
  private readonly logger = new Logger(CommandService.name);

  // Cache updated to hold the Cooldown (in milliseconds)
  private pumpCooldowns: Map<string, number> = new Map();

  // HARDWARE SAFETY: Default to 5 minutes (in milliseconds) if not set in DB
  private readonly DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly irrigationRepo: IrrigationRepository,
  ) {}

  async dispatchPumpCommand(payload: PumpLogDto): Promise<void> {
    const { device_id, duration, source, traceId } = payload;

    this.logger.log(
      `[${traceId}] Irrigation requested for device ${device_id} via ${source}`,
    );

    // 1. Fetch from Cache or Database securely
    let cooldownMs = this.pumpCooldowns.get(device_id);

    if (!cooldownMs) {
      const config = await this.irrigationRepo.getPumpConfig(device_id);

      if (!config || !config.cooldown) {
        this.logger.warn(
          `[${traceId}] No pump cooldown found for device ${device_id}. Using default 5 minutes.`,
        );
        cooldownMs = this.DEFAULT_COOLDOWN_MS;
      } else {
        // Assuming config.cooldown is stored in SECONDS, convert to MS
        cooldownMs = config.cooldown * 1000;
      }

      this.pumpCooldowns.set(device_id, cooldownMs);
    }

    // 2. HARDWARE SAFETY: Cooldown Check
    const lastPumpLog = await this.irrigationRepo.getLastPumpAction(device_id);

    if (lastPumpLog) {
      const timeSinceLastRun = Date.now() - lastPumpLog.timestamp.getTime();

      if (timeSinceLastRun < cooldownMs) {
        const remainingCooldown = Math.round(
          (cooldownMs - timeSinceLastRun) / 1000,
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
      // 3. Log the action to MongoDB (Audit Trail)
      await this.irrigationRepo.logPumpAction({
        device_id,
        traceId,
        duration: duration,
        source: source,
        status: PumpStatus.SUCCESS,
        timestamp: new Date(),
      });

      // 4. Construct the payload for the ESP32 (e.g., "ON_120")
      const physicalCommand = `ON_${duration}`;

      // 5. Send it to the MQTT Service to be broadcasted over the internet
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

  // CACHE INVALIDATION: Listen for the same event the Automation Service uses!
  // If the user changes their config in the React UI, we must clear this cache.
  @OnEvent('PUMP_CONFIG_UPDATED')
  clearCache(deviceId: string) {
    this.logger.log(`Clearing cached pump cooldown for device: ${deviceId}`);
    this.pumpCooldowns.delete(deviceId);
  }
}
