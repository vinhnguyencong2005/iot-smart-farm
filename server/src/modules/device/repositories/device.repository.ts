import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Device, DeviceDocument } from '../schemas/device.schema';
import { SensorType } from '../enums/config.enums';
import {
  UpdateSensorConfigDto,
  UpdatePumpConfigDto,
} from '../dtos/update-config.dto';

@Injectable()
export class DeviceRepository {
  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
    private readonly logger: Logger,
  ) {}

  async findDeviceByMacAddress(macAddress: string): Promise<Device | null> {
    const device = await this.deviceModel.findOne({ macAddress }).lean().exec();
    if (!device) {
      this.logger.warn(`Device not found: MAC Address - ${macAddress}`);
      return null;
    }
    return device;
  }

  async findById(id: string): Promise<Device | null> {
    const device = await this.deviceModel.findOne({ _id: id }).lean().exec();
    if (!device) {
      this.logger.warn(`Device not found: ID - ${id}`);
      return null;
    }
    return device;
  }

  async updateSensorConfig(
    id: string,
    sensorType: SensorType,
    configData: UpdateSensorConfigDto,
  ): Promise<Device | null> {
    const device = await this.deviceModel
      .findByIdAndUpdate(
        id,
        { $set: { [`sensorConfigs.${sensorType}`]: configData } },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();

    if (!device) {
      this.logger.warn(
        `Failed to update sensor config: Device not found - ID ${id}`,
      );
      return null;
    }

    return device;
  }

  async updatePumpConfig(
    id: string,
    configData: UpdatePumpConfigDto,
  ): Promise<Device | null> {
    const device = await this.deviceModel
      .findByIdAndUpdate(
        id,
        { $set: { pumpConfig: configData } },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();
    if (!device) {
      this.logger.warn(
        `Failed to update pump config: Device not found - ID ${id}`,
      );
      return null;
    }

    return device;
  }
}
