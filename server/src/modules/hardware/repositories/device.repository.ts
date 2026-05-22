import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from '../schemas/device.schema';

@Injectable()
export class DeviceRepository {
  private readonly logger = new Logger(DeviceRepository.name);
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
  ) {}

  async findByMacAddress(macAddress: string): Promise<DeviceDocument | null> {
    try {
      return await this.deviceModel.findOne({ mac_address: macAddress }).exec();
    } catch (error) {
      this.logger.error(
        `Error finding device with MAC address ${macAddress}: `,
        error,
      );
      throw error;
    }
  }

  async createDevice(macAddress: string): Promise<DeviceDocument> {
    try {
      const newDevice = new this.deviceModel({ mac_address: macAddress });
      return await newDevice.save();
    } catch (error) {
      this.logger.error(
        `Error creating device with MAC address ${macAddress}: `,
        error,
      );
      throw error;
    }
  }
}
