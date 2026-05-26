import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSensorConfigDto {
  @ApiProperty({
    example: 20,
    description: 'Minimum trigger threshold',
  })
  @IsNumber()
  minThreshold!: number;

  @ApiProperty({
    example: 80,
    description: 'Maximum trigger threshold',
  })
  @IsNumber()
  maxThreshold!: number;
}

export class UpdatePumpConfigDto {
  @ApiProperty({
    example: 60000,
    description: 'Cooldown time in milliseconds',
  })
  @IsNumber()
  cooldownMs!: number;

  @ApiProperty({
    example: 5000,
    description: 'How long the pump runs in milliseconds',
  })
  @IsNumber()
  defaultRunTimeMs!: number;
}
