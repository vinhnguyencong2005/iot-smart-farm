import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { GlobalStateService } from '../../global-state/services/global-state.service';
import { DeviceRepository } from '../../device/repositories/device.repository';
import { IrrigationCommandDispatchEvent } from '../events/irrigation.event';

@Injectable()
export class IrrigationService {
  private readonly logger = new Logger(IrrigationService.name);

  constructor(
    private readonly globalState: GlobalStateService,
    private readonly deviceRepository: DeviceRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async triggerPump(deviceId: string, isManual = true) {
    const device = await this.deviceRepository.findById(deviceId);

    if (!device) {
      throw new NotFoundException('Device not found in database');
    }

    const pumpConfig = device.pumpConfig;

    if (!pumpConfig) {
      throw new NotFoundException(
        `No pump configuration found for device ${deviceId}`,
      );
    }

    const now = new Date();

    if (pumpConfig.lastTriggered) {
      const lastWateredTime = new Date(pumpConfig.lastTriggered).getTime();
      const timeSinceLastWatered = now.getTime() - lastWateredTime;

      if (timeSinceLastWatered < pumpConfig.cooldownMs) {
        const remainingSeconds = Math.ceil(
          (pumpConfig.cooldownMs - timeSinceLastWatered) / 1000,
        );

        this.logger.warn(
          `Device ${deviceId} pump trigger rejected: On database cooldown for ${remainingSeconds}s`,
        );

        throw new ConflictException(
          `Pump is on cooldown. Please wait ${remainingSeconds} seconds.`,
        );
      }
    }

    await this.deviceRepository.updatePumpLastTriggered(deviceId, now);

    const triggerType = isManual ? 'MANUAL' : 'ENV';
    this.logger.log(
      `[${triggerType}] Pump trigger approved for Device ${device.name} (${deviceId}) [${pumpConfig.defaultRunTimeMs}ms]`,
    );

    const dispatchEvent = new IrrigationCommandDispatchEvent(
      device.macAddress,
      pumpConfig.defaultRunTimeMs,
      isManual ? 'MANUAL' : 'ENV',
    );

    this.eventEmitter.emit('irrigation.command.dispatch', dispatchEvent);

    return {
      message: 'Pump triggered successfully',
      triggerType, 
      durationMs: pumpConfig.defaultRunTimeMs,
      cooldownMs: pumpConfig.cooldownMs,
      lastTriggered: now,
    };
  }

  @OnEvent('irrigation.automation.trigger', { async: true })
  async handleAutomationTrigger(payload: { deviceId: string; deviceName: string }) {
    try {
      this.logger.log(
        `[AUTO-ENGINE] Nhận tín hiệu kích hoạt tự động cho thiết bị: ${payload.deviceName}`,
      );

      await this.triggerPump(payload.deviceId, false);

      this.logger.log(
        `[AUTO-ENGINE] Đã thực thi lệnh bật bơm tự động thành công cho ${payload.deviceName}`,
      );
    } catch (error: any) {
      this.logger.warn(
        `[AUTO-ENGINE] Bơm tự động bị hủy lệnh bảo vệ. Lý do: ${error.message}`,
      );
    }
  }
}