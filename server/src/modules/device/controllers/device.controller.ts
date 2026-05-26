import {
  Controller,
  Body,
  Post,
  Param,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

import { LookupDeviceService } from '../services/lookup-device.service';
import { UpdateConfigService } from '../services/update-config.service';
import { LookupDeviceDto } from '../dtos/lookup-device.dto';
import {
  UpdateSensorConfigDto,
  UpdatePumpConfigDto,
} from '../dtos/update-config.dto';
import { SensorType } from '../enums/config.enums';

@ApiTags('Device')
@Controller('device')
export class DeviceController {
  constructor(
    private readonly lookupDeviceService: LookupDeviceService,
    private readonly updateConfigService: UpdateConfigService,
    private readonly logger: Logger,
  ) {}

  @Post('lookup')
  @ApiOperation({
    summary: 'Find a device ID by its MAC address',
  })
  @ApiResponse({ status: 200, description: 'Returns the device document.' })
  @ApiResponse({ status: 404, description: 'Device not found.' })
  async lookupDevice(@Body() lookupDeviceDto: LookupDeviceDto) {
    return this.lookupDeviceService.lookupDevice(lookupDeviceDto);
  }

  @Post(':id/sensor-config/:sensorType')
  @ApiOperation({ summary: 'Update the min/max limits for a specific sensor' })
  @ApiParam({ name: 'sensorType', enum: SensorType }) // Tells Swagger this is an Enum
  @ApiResponse({ status: 200, description: 'Config updated successfully.' })
  async updateSensorConfig(
    @Body() updateSensorConfigDto: UpdateSensorConfigDto,
    @Param('id') id: string,
    @Param('sensorType') sensorType: SensorType,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      this.logger.warn(`Invalid MongoDB ID format received: ${id}`);
      throw new BadRequestException('Invalid Device ID');
    }

    return this.updateConfigService.updateSensorConfig(
      id,
      sensorType,
      updateSensorConfigDto,
    );
  }

  @Post(':id/pump-config')
  @ApiOperation({ summary: 'Update the cooldown and run times for the pump' })
  @ApiResponse({
    status: 200,
    description: 'Pump config updated successfully.',
  })
  async updatePumpConfig(
    @Body() updatePumpConfigDto: UpdatePumpConfigDto,
    @Param('id') id: string,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      this.logger.warn(`Invalid MongoDB ID format received: ${id}`);
      throw new BadRequestException('Invalid Device ID');
    }

    return this.updateConfigService.updatePumpConfig(id, updatePumpConfigDto);
  }
}
