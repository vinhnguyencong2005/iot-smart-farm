import { Controller, Get, Query, Post, Param } from '@nestjs/common';
import { AnalyticService } from '../services/analytic.service';
import { GetTelemetryTrendDto } from '../dto/get-telemetry-trend.dto';
import { GetPumpStatsDto } from '../dto/get-pump-stats.dto'; 
import { GetLatestTelemetryDto } from '../dto/get-latest-telemetry.dto';
@Controller('analytic')
export class AnalyticController {
  constructor(private readonly analyticService: AnalyticService) {}

  // API: GET /analytic/telemetry/trend?deviceId=...&startDate=...&endDate=...&resolution=day
  @Get('telemetry/trend')
  async getTelemetryTrend(@Query() dto: GetTelemetryTrendDto) {
    return this.analyticService.getTelemetryTrend(dto);
  }

  // API: GET /analytic/irrigation/usage?deviceId=...&startDate=...&endDate=...
  @Get('irrigation/usage')
  async getPumpStats(@Query() dto: GetPumpStatsDto) {
    const result = await this.analyticService.getPumpStats(dto);
    return result.length > 0 ? result[0] : { totalActivations: 0, totalDurationMs: 0 };
  }

  // API: GET /analytic/telemetry/history?deviceId=...
  @Get('telemetry/history')
  async getTelemetryHistory(@Query() dto: GetLatestTelemetryDto,  @Query('limit') limit = 50,) {
    return this.analyticService.getTelemetryHistory(dto.deviceId, limit);
  }

  // API: GET /analytic/telemetry/latest?deviceId=...
  @Get('telemetry/latest')
  async getLatestTelemetry(@Query() dto: GetLatestTelemetryDto) {
    return this.analyticService.getLatestTelemetry(dto.deviceId);
  }

  // API: POST /analytic/seed-fake-data/:deviceId
  @Post('seed-fake-data/:deviceId')
  async seedFakeData(@Param('deviceId') deviceId: string) {
    return this.analyticService.seedFakeData(deviceId);
  }
}