import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { DeviceModule } from './modules/device/device.module';
import { MqttClientModule } from './modules/mqtt-client/mqtt-client.module';
// import { EnvironmentModule } from './modules/environment/environment.module';
import { IrrigationModule } from './modules/irrigation/irrigation.module';
import { AnalyticModule } from './modules/analytic/analytic.module';
import { MonitorModule } from './modules/monitor/monitor.module';
import { GlobalStateModule } from './modules/global-state/global-state.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const port = configService.get<string>('MONGODB_PORT');
        const host = configService.get<string>('MONGODB_HOST');
        const username = configService.get<string>('MONGODB_USERNAME');
        const password = configService.get<string>('MONGODB_PASSWORD');
        const dbName = configService.get<string>('MONGODB_DB_NAME');
        const authSource = configService.get<string>('MONGODB_AUTH_SOURCE');

        const uri = `mongodb://${username}:${password}@${host}:${port}/${dbName}?authSource=${authSource}`;

        return {
          uri,
        };
      },
    }),

    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 10,
    }),

    DeviceModule,
    MqttClientModule,
    // EnvironmentModule,
    IrrigationModule,
    AnalyticModule,
    MonitorModule,
    GlobalStateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
