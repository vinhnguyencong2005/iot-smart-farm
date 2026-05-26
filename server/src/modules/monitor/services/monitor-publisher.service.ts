import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import * as amqp from 'amqplib';

import { GlobalStateService } from '../../global-state/services/global-state.service';
import { CleanedDataEvent } from '../../mqtt-client/events/cleaned-data.event';

@Injectable()
export class MonitorPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MonitorPublisherService.name);

  private connection!: amqp.ChannelModel;
  private channel!: amqp.Channel;
  private readonly EXCHANGE_NAME = 'telemetry';

  constructor(
    private readonly configService: ConfigService,
    private readonly globalState: GlobalStateService,
  ) {}

  async onModuleInit() {
    await this.connectToRabbitMQ();
  }

  async onModuleDestroy() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }

  private async connectToRabbitMQ() {
    const user = this.configService.get<string>('RABBITMQ_USER');
    const pass = this.configService.get<string>('RABBITMQ_PASS');
    const host = this.configService.get<string>('RABBITMQ_HOST');
    const port = this.configService.get<string>('RABBITMQ_PORT');

    if (!user || !pass || !host || !port) {
      this.logger.error('CRITICAL: RabbitMQ credentials missing from .env');
      return;
    }

    const rabbitUrl = `amqp://${user}:${pass}@${host}:${port}`;

    try {
      this.connection = await amqp.connect(rabbitUrl);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.EXCHANGE_NAME, 'topic', {
        durable: false,
      });

      this.logger.log('Connected to RabbitMQ for UI Real-Time Publishing');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
    }
  }

  // --- 1. SENSOR TELEMETRY TO FRONTEND ---
  // Updated to match your DataCleanerService event
  @OnEvent('mqtt-client.dataCleaned')
  handleNewTelemetry(event: CleanedDataEvent) {
    if (!this.channel) return;

    const deviceIdString = event.deviceId.toString();

    // The routing key: device.12345
    // React can subscribe to `/exchange/telemetry/device.12345`
    const routingKey = `device.${deviceIdString}`;

    // We stringify the CleanedDataEvent object directly
    const payload = JSON.stringify(event);

    this.channel.publish(this.EXCHANGE_NAME, routingKey, Buffer.from(payload));

    this.logger.debug(`Published Telemetry to UI topic: ${routingKey}`);
  }

  // --- 2. PUMP COMMANDS TO FRONTEND ---
  // Matches the event in your MqttPubSubService
  // @OnEvent('irrigation.command.dispatch')
  // handlePumpDispatch(payload: { macAddress: string; durationMs: number }) {
  //   if (!this.channel) return;

  //   const deviceId = this.globalState.getDeviceIdFromMac(payload.macAddress);

  //   if (!deviceId) return;

  //   // Separate routing key for pump events: device.12345.pump
  //   const routingKey = `device.${deviceId}.pump`;
  //   const uiPayload = JSON.stringify({
  //     event: 'PUMP_ACTIVATED',
  //     durationMs: payload.durationMs,
  //     timestamp: new Date().toISOString(),
  //   });

  //   this.channel.publish(
  //     this.EXCHANGE_NAME,
  //     routingKey,
  //     Buffer.from(uiPayload),
  //   );

  //   this.logger.debug(`Published Pump Event to UI topic: ${routingKey}`);
  // }
}
