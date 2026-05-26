import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetLatestTelemetryDto {
  @ApiProperty({
    description: 'Device ID (e.g. 11:22:33:44:55:66)',
  })
  @IsNotEmpty()
  @IsString()
  deviceId!: string;
}
