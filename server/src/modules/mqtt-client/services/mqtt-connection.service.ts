import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttConnectionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttConnectionService.name);
  private client!: mqtt.MqttClient;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.logger.log('Connecting to MQTT Broker...');

    const username = this.configService.get<string>('ADAFRUIT_AIO_USERNAME');
    const key = this.configService.get<string>('ADAFRUIT_AIO_KEY');

    if (!username || !key) {
      this.logger.error(
        'CRITICAL: Adafruit IO credentials missing from .env file. MQTT Client offline.',
      );
      return;
    }

    const brokerUrl = `mqtts://${username}:${key}@io.adafruit.com`;

    this.client = mqtt.connect(brokerUrl, {
      port: 8883,
      reconnectPeriod: 5000,
      clientId: `iot_smart_farm_backend_${Math.random().toString(16).substring(2, 8)}`,
    });

    this.client.on('connect', () => {
      this.logger.log('Successfully connected to MQTT Broker (Adafruit IO).');
    });

    this.client.on('error', (err) => {
      this.logger.error(`MQTT Connection Error: ${err.message}`);
    });
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.end();
      this.logger.log('Disconnected from MQTT Broker (Adafruit IO).');
    }
  }

  /**
   * Exposes the active MQTT client for other services to use.
   */
  public getClient(): mqtt.MqttClient {
    return this.client;
  }
}
