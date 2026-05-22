import { Controller, Get, Param } from '@nestjs/common';
import { EnvironmentRepository } from './environment.repository';

@Controller('environment')
export class EnvironmentController {
  constructor(private readonly environmentRepo: EnvironmentRepository) {}

  // GET /environment/device/:deviceId/config
  @Get('device/:deviceId/config')
  async getSensorConfig(@Param('deviceId') deviceId: string) {
    const config = await this.environmentRepo.getSensorConfig(deviceId);
    return config || { message: 'No configuration found for this device.' };
  }
}
