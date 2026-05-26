import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetPumpStatsDto {
  @ApiProperty({
    description: 'Device ID (e.g. 11:22:33:44:55:66)',
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
}