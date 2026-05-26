import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { DeviceRepository } from '../repositories/device.repository';
import {
  UpdateSensorConfigDto,
  UpdatePumpConfigDto,
} from '../dtos/update-config.dto';
import { SensorType } from '../enums/config.enums';
import {
  UpdateSensorConfigEvent,
  UpdatePumpConfigEvent,
} from '../events/update-config.event';

@Injectable()
export class UpdateConfigService {
  private readonly logger = new Logger(UpdateConfigService.name);

  constructor(
    private readonly deviceRepository: DeviceRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async updateSensorConfig(
    id: string,
    sensorType: SensorType,
    configData: UpdateSensorConfigDto,
  ) {
    const updatedDevice = await this.deviceRepository.updateSensorConfig(
      id,
      sensorType,
      configData,
    );
    if (!updatedDevice) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
    this.logger.log(
      `Sensor config updated for device ID ${id}, sensor type ${sensorType}`,
    );

    const event = new UpdateSensorConfigEvent(id, sensorType, configData);
    this.eventEmitter.emit('device.sensorConfigUpdated', event);

    return updatedDevice;
  }

  async updatePumpConfig(id: string, configData: UpdatePumpConfigDto) {
    const updatedDevice = await this.deviceRepository.updatePumpConfig(
      id,
      configData,
    );
    if (!updatedDevice) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
    this.logger.log(`Pump config updated for device ID ${id}`);

    const event = new UpdatePumpConfigEvent(id, configData);
    this.eventEmitter.emit('device.pumpConfigUpdated', event);

    return updatedDevice;
  }
}
