import { Controller, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IrrigationService } from '../services/irrigation.service';

@ApiTags('Irrigation')
@Controller('irrigation')
export class IrrigationController {
  constructor(private readonly irrigationService: IrrigationService) {}

  @Post(':id/pump')
  @ApiOperation({
    summary: 'Manually trigger the water pump for a specific device',
  })
  @ApiParam({ name: 'id', description: 'The MongoDB ObjectId of the device' })
  @ApiResponse({ status: 200, description: 'Pump triggered successfully.' })
  @ApiResponse({ status: 409, description: 'Pump is currently on cooldown.' })
  @ApiResponse({
    status: 404,
    description: 'Device or pump configuration not found.',
  })
  async triggerPump(@Param('id') id: string) {
    return this.irrigationService.triggerPump(id);
  }
}
