import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Device, DeviceDocument } from '../../device/schemas/device.schema';

@Injectable()
export class GlobalStateRepository {
  private readonly logger = new Logger(GlobalStateRepository.name);

  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
  ) {}

  async getAllDevices() {
    const devices = await this.deviceModel.find({}).lean().exec();
    if (!devices) {
      this.logger.warn(`No device not found in the Database`);
    }
    return devices;
  }
}
