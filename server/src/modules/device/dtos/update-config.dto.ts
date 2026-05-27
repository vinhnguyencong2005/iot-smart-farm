import {
  IsNumber,
  IsBoolean,
  IsString,
  IsEnum,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';

import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import { TriggerCondition } from '../enums/config.enums';

export class PumpTriggerDto {
  @ApiProperty({
    example: 'soil_moisture',
    description: 'Sensor type used for automatic trigger',
  })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiProperty({
    example: TriggerCondition.LESS_THAN,
    enum: TriggerCondition,
    description: 'Comparison condition',
  })
  @IsEnum(TriggerCondition)
  condition!: TriggerCondition;

  @ApiProperty({
    example: 40,
    description: 'Trigger threshold value',
  })
  @IsNumber()
  value!: number;
}

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
    example: true,
    description: 'Enable or disable automatic watering',
  })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({
    type: PumpTriggerDto,
    description: 'Automatic trigger configuration',
  })
  @ValidateNested()
  @Type(() => PumpTriggerDto)
  trigger!: PumpTriggerDto;

  @ApiProperty({
    example: 60000,
    description: 'Cooldown time in milliseconds',
  })
  @IsNumber()
  cooldownMs!: number;

  @ApiProperty({
    example: 5000,
    description: 'Pump running duration in milliseconds',
  })
  @IsNumber()
  defaultRunTimeMs!: number;
}