import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';

import { SensorType, TriggerCondition } from '../../device/enums/config.enums';
import { GlobalStateService } from '../../global-state/services/global-state.service';
import { InitializerRepository } from '../repositories/initializer.repository';

export interface DemoDeviceData {
  name: string;
  macAddress: string;
  sensorConfigs?: any; 
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

    // 2. Define Demo Data (Nâng cấp trigger thành Mảng đa điều kiện & chuyển sang tên viết tắt)
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
        pumpConfig: {
          enabled: true,
          trigger: [
            {
              type: 'soil',
              condition: TriggerCondition.LESS_THAN,
              value: 40,
            },
            {
              type: 'temp',
              condition: TriggerCondition.GREATER_THAN,
              value: 35,
            }
          ],
          cooldownMs: 60000, 
          defaultRunTimeMs: 5000,
          lastTriggered: null,
        },
      },
      {
        name: 'Balcony Succulents',
        macAddress: '11:22:33:44:55:66',
        sensorConfigs: {
          [SensorType.SOIL_MOISTURE]: { minThreshold: 10, maxThreshold: 50 },
          [SensorType.TEMPERATURE]: { minThreshold: 10, maxThreshold: 40 },
        },
        pumpConfig: {
          enabled: true,
          trigger: [
            {
              type: 'soil',
              condition: TriggerCondition.LESS_THAN,
              value: 15,
            },
            {
              type: 'temp',
              condition: TriggerCondition.GREATER_THAN,
              value: 38,
            }
          ],
          cooldownMs: 120000, 
          defaultRunTimeMs: 3000,
          lastTriggered: null,
        },
      },
      {
        name: 'Melon Hydroponics', 
        macAddress: 'AA:BB:CC:DD:EE:FF',
        sensorConfigs: {
          [SensorType.SOIL_MOISTURE]: { minThreshold: 40, maxThreshold: 85 },
          [SensorType.HUMIDITY]: { minThreshold: 50, maxThreshold: 85 },
        },
        pumpConfig: {
          enabled: true,
          trigger: [
            {
              type: 'soil',
              condition: TriggerCondition.LESS_THAN,
              value: 50,
            },
            {
              type: 'humid',
              condition: TriggerCondition.LESS_THAN,
              value: 45,
            }
          ],
          cooldownMs: 90000, 
          defaultRunTimeMs: 8000, 
          lastTriggered: null,
        },
      },
      {
        name: 'Mushroom Darkroom', 
        macAddress: '77:88:99:AA:BB:CC',
        sensorConfigs: {
          [SensorType.HUMIDITY]: { minThreshold: 70, maxThreshold: 95 },
          [SensorType.LIGHT_LEVEL]: { minThreshold: 0, maxThreshold: 500 },
        },
        pumpConfig: {
          enabled: true,
          trigger: [
            {
              type: 'humid',
              condition: TriggerCondition.LESS_THAN,
              value: 75,
            },
            {
              type: 'light',
              condition: TriggerCondition.GREATER_THAN,
              value: 400,
            }
          ],
          cooldownMs: 30000, 
          defaultRunTimeMs: 4000,
          lastTriggered: null,
        },
      }
    ];

    const wasSeeded =
      await this.initializerRepo.initializeDatabase(demoDevices);

    if (wasSeeded) {
      this.logger.log('Demo data successfully seeded into MongoDB with Multiple Triggers!');
      await this.globalState.refreshCache();
    }
  }
}