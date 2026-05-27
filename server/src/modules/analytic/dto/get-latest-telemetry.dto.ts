import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetLatestTelemetryDto {
  @ApiProperty({
    description: 'Device ID (e.g. 6a142ad42989def1d84e0aa3)',
  })
  @IsNotEmpty()
  @IsString()
  deviceId!: string;
}
