import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { GlobalStateService } from '../../global-state/services/global-state.service';
import { DeviceRepository } from '../../device/repositories/device.repository';
import { IrrigationCommandDispatchEvent } from '../events/irrigation.event';

@Injectable()
export class IrrigationService {
  private readonly logger = new Logger(IrrigationService.name);

  // RAM cache to prevent drowning the plants (Device ID -> Timestamp of last watering)
  private lastWateredMap = new Map<string, number>();

  constructor(
    private readonly globalState: GlobalStateService,
    private readonly deviceRepository: DeviceRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async triggerPump(deviceId: string) {
    // 1. Fetch pump config from the fast RAM cache
    const pumpConfig = this.globalState.getPumpConfigs(deviceId);

    if (!pumpConfig) {
      throw new NotFoundException(
        `No pump configuration found for device ${deviceId}`,
      );
    }

    // 2. Enforce the Cooldown Rule
    const now = Date.now();
    const lastWatered = this.lastWateredMap.get(deviceId) || 0;
    const timeSinceLastWatered = now - lastWatered;

    if (timeSinceLastWatered < pumpConfig.cooldownMs) {
      const remainingSeconds = Math.ceil(
        (pumpConfig.cooldownMs - timeSinceLastWatered) / 1000,
      );
      this.logger.warn(
        `Device ${deviceId} pump trigger rejected: On cooldown for ${remainingSeconds}s`,
      );

      // Throwing an HTTP 409 Conflict tells the React frontend to show an error toast
      throw new ConflictException(
        `Pump is on cooldown. Please wait ${remainingSeconds} seconds.`,
      );
    }

    // 3. Lookup the MAC address for the MQTT payload
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) {
      throw new NotFoundException('Device not found in database');
    }

    // 4. Update the cooldown timer
    this.lastWateredMap.set(deviceId, now);

    this.logger.log(
      `Manual pump trigger approved for Device ${deviceId} (${pumpConfig.defaultRunTimeMs}ms)`,
    );

    // 5. Dispatch the command to the MQTT Client Module
    const dispatchEvent = new IrrigationCommandDispatchEvent(
      device.macAddress,
      pumpConfig.defaultRunTimeMs,
    );
    this.eventEmitter.emit('irrigation.command.dispatch', dispatchEvent);

    return {
      message: 'Pump triggered successfully',
      durationMs: pumpConfig.defaultRunTimeMs,
      cooldownMs: pumpConfig.cooldownMs,
    };
  }
}
