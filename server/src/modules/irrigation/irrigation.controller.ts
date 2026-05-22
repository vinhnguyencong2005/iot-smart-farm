import { Controller, Get, Post, Param, Body, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IrrigationRepository } from './irrigation.repository';
import { CommandService } from './services/command.service';
import { TriggerSource } from './enums/pump.enums';

@Controller('irrigation')
export class IrrigationController {
  private readonly logger = new Logger(IrrigationController.name);

  constructor(
    private readonly irrigationRepo: IrrigationRepository,
    private readonly commandService: CommandService,
  ) {}

  // GET /irrigation/device/:deviceId/config
  @Get('device/:deviceId/config')
  async getPumpConfig(@Param('deviceId') deviceId: string) {
    const config = await this.irrigationRepo.getPumpConfig(deviceId);
    return (
      config || { message: 'No pump configuration found for this device.' }
    );
  }

  // MANUAL TRIGGER
  // POST /irrigation/device/:deviceId/water
  @Post('device/:deviceId/water')
  async triggerManualWatering(
    @Param('deviceId') deviceId: string,
    @Body('duration') duration: number,
  ) {
    const traceId = uuidv4();
    const runTime = duration || 5; // Default to 5s

    await this.commandService.dispatchPumpCommand({
      device_id: deviceId,
      duration: runTime,
      source: TriggerSource.MANUAL,
      traceId,
      timestamp: new Date(),
    });

    return { message: 'Irrigation command sent successfully', traceId };
  }
}
