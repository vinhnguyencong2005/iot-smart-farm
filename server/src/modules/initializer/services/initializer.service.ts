import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

import { SensorType } from '../../device/enums/config.enums';
import { GlobalStateService } from '../../global-state/services/global-state.service';
import { InitializerRepository } from '../repositories/initializer.repository';

export interface DemoDeviceData {
  name: string;
  macAddress: string;
  sensorConfigs?: any; // Using any here to bypass strict Map types for the POJO
  pumpConfig?: any;
}

@Injectable()
export class InitializerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(InitializerService.name);

  constructor(
    private readonly initializerRepo: InitializerRepository,
    private readonly globalState: GlobalStateService,
  ) {}

  async onApplicationBootstrap() {
    // 1. Sync Indexes
    await this.initializerRepo.syncDatabaseIndexes();

    // 2. Define Demo Data
    const demoDevices: DemoDeviceData[] = [
      {
        name: 'Tomato Greenhouse',
        macAddress: 'A1:B2:C3:D4:E5:F6',
        sensorConfigs: {
          [SensorType.SOIL_MOISTURE]: { minThreshold: 30, maxThreshold: 80 },
          [SensorType.TEMPERATURE]: { minThreshold: 15, maxThreshold: 35 },
          [SensorType.HUMIDITY]: { minThreshold: 40, maxThreshold: 90 },
          [SensorType.LIGHT_LEVEL]: { minThreshold: 1000, maxThreshold: 5000 },
        },
        pumpConfig: { cooldownMs: 60000, defaultRunTimeMs: 5000 },
      },
      {
        name: 'Balcony Succulents',
        macAddress: '11:22:33:44:55:66',
        sensorConfigs: {
          [SensorType.SOIL_MOISTURE]: { minThreshold: 10, maxThreshold: 50 },
        },
        pumpConfig: { cooldownMs: 120000, defaultRunTimeMs: 3000 },
      },
    ];

    // 3. Upsert the data
    const wasSeeded =
      await this.initializerRepo.initializeDatabase(demoDevices);

    // 4. Only log and refresh if new data was added
    if (wasSeeded) {
      this.logger.log('✅ Demo data successfully seeded into MongoDB!');
      await this.globalState.refreshCache();
    }
  }
}
