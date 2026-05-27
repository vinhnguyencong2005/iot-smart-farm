import { IsNotEmpty, IsString, IsDateString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetPumpStatsDto {
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

  @ApiProperty({
    description: 'Current page number for pagination',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({
    description: 'Number of records per page for pagination',
    example: 20,
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}