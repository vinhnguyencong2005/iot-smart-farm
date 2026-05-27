import { IsNotEmpty, IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TimeResolution {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
}

export class GetTelemetryTrendDto {
  @ApiProperty({
    description: 'Device ID (e.g. 6a142ad42989def1d84e0aa3)',
  })
  @IsNotEmpty()
  @IsString()
  deviceId!: string;

  @ApiProperty({
    description: 'Start date',
    example: '2026-05-20T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: 'End date',
    example: '2026-05-26T23:59:59.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({
    enum: TimeResolution,
    default: TimeResolution.DAY,
    description: 'Data grouping resolution',
  })
  @IsOptional()
  @IsEnum(TimeResolution)
  resolution?: TimeResolution = TimeResolution.DAY;
}