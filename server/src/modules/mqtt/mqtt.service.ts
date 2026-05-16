import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import * as mqtt from 'mqtt';
import { v4 as uuidv4 } from 'uuid';
import { DeviceRepository } from '../auth/device.repository';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client!: mqtt.MqttClient;

  private sensorTopic!: string;
  private pumpTopic!: string;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    // 1. Inject the Device Repository here!
    private deviceRepo: DeviceRepository,
  ) {}

  onModuleInit() {
    this.connectToBroker();
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.end();
      this.logger.log('Disconnected from Adafruit IO MQTT Broker');
    }
  }

  private connectToBroker() {
    const username = this.configService.get<string>('ADAFRUIT_AIO_USERNAME');
    const key = this.configService.get<string>('ADAFRUIT_AIO_KEY');

    if (!username || !key) {
      this.logger.error(
        'CRITICAL: Adafruit IO credentials missing from .env file. MQTT Client offline.',
      );
      return;
    }

    this.sensorTopic = `${username}/feeds/sensors`;
    this.pumpTopic = `${username}/feeds/command`;
    const brokerUrl = `mqtts://${username}:${key}@io.adafruit.com`;

    this.client = mqtt.connect(brokerUrl, {
      port: 8883,
      reconnectPeriod: 5000,
      clientId: `fernlidae_backend_${Math.random().toString(16).substring(2, 8)}`,
    });

    this.client.on('connect', () => {
      this.logger.log('Successfully connected to Adafruit IO');
      this.client.subscribe(this.sensorTopic, (err) => {
        if (err) {
          this.logger.error(`Failed to subscribe to ${this.sensorTopic}`, err);
        } else {
          this.logger.log(`Listening for telemetry on: ${this.sensorTopic}`);
        }
      });
    });

    this.client.on('error', (error) =>
      this.logger.error('MQTT Connection Error', error),
    );

    this.client.on('offline', () =>
      this.logger.warn('MQTT Client went offline. Attempting to reconnect...'),
    );

    this.client.on('message', (topic, message) => {
      if (topic === this.sensorTopic) {
        void this.handleIncomingTelemetry(message.toString());
      }
    });
  }

  private async handleIncomingTelemetry(rawPayload: string) {
    const traceId: string = uuidv4();
    this.logger.debug(`[${traceId}] Raw telemetry received from ESP32`);

    try {
      const parsedData = JSON.parse(rawPayload) as Record<string, unknown>;
      const macAddressRaw = parsedData['mac_address'];

      // Ensure it is actually a string before we query the database
      if (typeof macAddressRaw !== 'string') {
        this.logger.warn(
          `[${traceId}] Payload missing valid mac_address string. Dropping payload.`,
        );
        return;
      }

      const macAddress: string = macAddressRaw.toUpperCase();

      const device = await this.deviceRepo.findByMacAddress(macAddress);
      if (!device) {
        this.logger.warn(
          `[${traceId}] Unregistered MAC Address: ${macAddress}. Dropping payload.`,
        );
        return;
      }

      // Replace the MAC address with the MongoDB ObjectId
      if (!device) {
        this.logger.warn(
          `[${traceId}] Unregistered MAC Address: ${macAddress}. Dropping payload.`,
        );
        return;
      }
      // No longer need the MAC address.
      delete parsedData.mac_address;

      // Hand the raw data off to the internal Event Bus.
      this.eventEmitter.emit('RAW_MQTT_RECEIVED', {
        traceId,
        device_id: device._id.toString(),
        ...parsedData,
      });
    } catch (error) {
      this.logger.error(
        `[${traceId}] Dropping payload: Error processing hardware data. Payload: ${rawPayload}. Error: `,
        error,
      );
    }
  }

  @OnEvent('PUMP_CMD_DISPATCHED')
  handlePumpCommand(payload: { traceId: string; command: string }) {
    if (!this.client || !this.client.connected) {
      this.logger.error(
        `[${payload.traceId}] Cannot send pump command: MQTT client is disconnected.`,
      );
      return;
    }

    this.logger.log(
      `[${payload.traceId}] Dispatching command to ESP32: ${payload.command}`,
    );
    this.client.publish(
      this.pumpTopic,
      payload.command,
      { qos: 1 },
      (error) => {
        if (error)
          this.logger.error(
            `[${payload.traceId}] Failed to publish pump command`,
            error,
          );
      },
    );
  }
}
