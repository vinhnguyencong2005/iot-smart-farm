import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DeviceRepository } from '../repositories/device.repository';
import { LookupDeviceDto } from '../dtos/lookup-device.dto';

@Injectable()
export class LookupDeviceService {
  private readonly logger = new Logger(LookupDeviceService.name);

  constructor(private readonly deviceRepository: DeviceRepository) {}

  async lookupDevice(lookupDeviceDto: LookupDeviceDto) {
    const device = await this.deviceRepository.findDeviceByMacAddress(
      lookupDeviceDto.macAddress,
    );
    if (!device) {
      this.logger.warn(
        `Device not found for MAC address: ${lookupDeviceDto.macAddress}`,
      );
      throw new NotFoundException(
        `Device with MAC address ${lookupDeviceDto.macAddress} not found`,
      );
    }
    return device;
  }
}
