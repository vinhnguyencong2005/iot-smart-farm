import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { HardwareModule } from './modules/hardware/hardware.module';
import { EnvironmentModule } from './modules/environment/environment.module';
import { MonitorModule } from './modules/monitor/monitor.module';
import { IrrigationModule } from './modules/irrigation/irrigation.module';
import { MqttModule } from './modules/mqtt/mqtt.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/smart-irrigation',
      }),
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 10,
    }),
    HardwareModule,
    EnvironmentModule,
    MonitorModule,
    IrrigationModule,
    MqttModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
