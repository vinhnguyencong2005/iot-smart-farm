import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

import { MqttConnectionService } from './mqtt-connection.service';
import { DataCleanerService } from './data-cleaner.service';

import { IrrigationCommandDispatchEvent } from '../../irrigation/events/irrigation.event';

@Injectable()
export class MqttPubSubService implements OnModuleInit {
  private readonly logger = new Logger(MqttPubSubService.name);
  private sensorTopic!: string;
  private pumpTopic!: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly mqttConnection: MqttConnectionService,
    private readonly dataCleaner: DataCleanerService,
  ) {}

  onModuleInit() {
    const client = this.mqttConnection.getClient();

    const username = this.configService.get<string>('ADAFRUIT_AIO_USERNAME');
    this.sensorTopic = `${username}/feeds/sensors`;
    this.pumpTopic = `${username}/feeds/command`;

    // Set up subscriptions once the client connects
    client.on('connect', () => {
      client.subscribe(this.sensorTopic, (err) => {
        if (!err) {
          this.logger.log(`Subscribed to topic: ${this.sensorTopic}`);
        } else {
          this.logger.error(`Failed to subscribe to ${this.sensorTopic}`);
        }
      });
    });

    // Route incoming messages to the Data Cleaner
    client.on('message', (topic, payload) => {
      if (topic === this.sensorTopic) {
        this.dataCleaner.processIncomingTelemetry(payload);
      }
    });
  }

  // --- OUTGOING COMMANDS ---

  /**
   * Listens for the internal dispatch event and publishes it to the hardware.
   * Assuming you are using a class or type for the pump command event payload.
   */
  @OnEvent('irrigation.command.dispatch')
  handlePumpDispatch(payload: IrrigationCommandDispatchEvent) {
    const client = this.mqttConnection.getClient();

    if (!client?.connected) {
      this.logger.error(
        'Cannot dispatch command: MQTT client is disconnected.',
      );
      return;
    }

    const commandPayload = JSON.stringify({
      cmd: 'PUMP_ON',
      duration: payload.durationMs,
    });

    client.publish(this.pumpTopic, commandPayload, { qos: 1 }, (err) => {
      if (err) {
        this.logger.error(`Failed to publish command to ${this.pumpTopic}`);
      } else {
        this.logger.log(
          `Published pump command to ${this.pumpTopic}: ${commandPayload}`,
        );
      }
    });
  }
}
