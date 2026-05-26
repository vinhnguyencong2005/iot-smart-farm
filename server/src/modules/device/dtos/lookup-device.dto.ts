import { IsString, IsUppercase, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LookupDeviceDto {
  @ApiProperty({
    example: 'A1:B2:C3:D4:E5:F6',
    description: 'The physical MAC address of the ESP32 board',
  })
  @IsNotEmpty()
  @IsUppercase()
  @IsString()
  macAddress!: string;
}
