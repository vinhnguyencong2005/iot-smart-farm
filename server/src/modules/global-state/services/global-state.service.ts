import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Device, DeviceDocument } from '../../device/schemas/device.schema';
import { SensorType } from '../../device/enums/config.enums';
import { SensorConfig } from '../../device/schemas/sensor-config.schema';
import { PumpConfig } from '../../device/schemas/pump-config.schema';

import {
  UpdateSensorConfigEvent,
  UpdatePumpConfigEvent,
} from '../../device/events/update-config.event';

@Injectable()
export class GlobalStateService implements OnModuleInit {
  private macToIdMap = new Map<string, string>();
  private deviceSensorsMap = new Map<string, Record<string, SensorConfig>>();
  private devicePumpsMap = new Map<string, PumpConfig>();

  private readonly logger = new Logger(GlobalStateService.name);

  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
  ) {}

  async onModuleInit() {
    this.logger.log('Bootstrapping Global State from MongoDB...');
    const devices = await this.deviceModel.find({}).lean().exec();

    for (const device of devices) {
      const deviceId = device._id.toString();

      this.macToIdMap.set(device.macAddress, deviceId);

      this.deviceSensorsMap.set(
        deviceId,
        device.sensorConfigs as unknown as Record<string, SensorConfig>,
      );
      this.devicePumpsMap.set(deviceId, device.pumpConfig);
    }

    this.logger.log(`Loaded ${devices.length} devices into RAM cache.`);
  }

  getDeviceIdFromMac(macAddress: string): string | undefined {
    return this.macToIdMap.get(macAddress);
  }

  getSensorConfigs(
    deviceId: string,
    sensorType: SensorType,
  ): SensorConfig | undefined {
    const sensors = this.deviceSensorsMap.get(deviceId);

    return sensors ? sensors[sensorType] : undefined;
  }

  getPumpConfigs(deviceId: string): PumpConfig | undefined {
    return this.devicePumpsMap.get(deviceId);
  }

  @OnEvent('device.sensorConfigUpdated')
  handleSensorConfigUpdate(payload: UpdateSensorConfigEvent) {
    const id = payload.deviceId;

    if (!this.deviceSensorsMap.has(id)) {
      this.deviceSensorsMap.set(id, {});
    }

    const sensors = this.deviceSensorsMap.get(id);
    sensors![payload.sensorType] = payload.configData;

    this.logger.log(`RAM Cache Updated: Sensor config for Device ${id}`);
  }

  @OnEvent('device.pumpConfigUpdated')
  handlePumpConfigUpdate(payload: UpdatePumpConfigEvent) {
    const id = payload.deviceId;
    this.devicePumpsMap.set(id, payload.configData);
    this.logger.log(`RAM Cache Updated: Pump config for Device ${id}`);
  }
}
