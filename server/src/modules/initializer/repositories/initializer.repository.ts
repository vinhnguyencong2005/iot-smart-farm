import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Device, DeviceDocument } from '../../device/schemas/device.schema';
import { DemoDeviceData } from '../services/initializer.service';

@Injectable()
export class InitializerRepository {
  private readonly logger = new Logger(InitializerRepository.name);

  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
  ) {}

  async syncDatabaseIndexes() {
    try {
      this.logger.log('Synchronizing Mongoose schema indexes...');
      await this.deviceModel.syncIndexes();
      this.logger.log('✅ Database indexes synchronized successfully.');
    } catch (error) {
      this.logger.error('Failed to sync database indexes', error);
    }
  }

  // Returns true if ANY new devices were inserted, false if all already existed
  async initializeDatabase(devices: DemoDeviceData[]): Promise<boolean> {
    let wasSeeded = false;

    for (const device of devices) {
      // $setOnInsert ensures we only apply the data if the device is brand new.
      // If the macAddress already exists, it does absolutely nothing.
      const result = await this.deviceModel.updateOne(
        { macAddress: device.macAddress },
        { $setOnInsert: device },
        { upsert: true, runValidators: true },
      );

      if (result.upsertedCount > 0) {
        this.logger.log(`Seeded missing demo device: ${device.name}`);
        wasSeeded = true;
      }
    }

    if (!wasSeeded) {
      this.logger.log(
        'All demo devices already exist. Skipping initialization.',
      );
    }

    return wasSeeded;
  }
}
