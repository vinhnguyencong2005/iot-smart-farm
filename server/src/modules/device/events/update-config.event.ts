import { SensorType } from '../enums/config.enums';
import {
  UpdateSensorConfigDto,
  UpdatePumpConfigDto,
} from '../dtos/update-config.dto';

export class UpdateSensorConfigEvent {
  constructor(
    public readonly deviceId: string,
    public readonly sensorType: SensorType,
    public readonly configData: UpdateSensorConfigDto,
  ) {}
}

export class UpdatePumpConfigEvent {
  constructor(
    public readonly deviceId: string,
    public readonly configData: UpdatePumpConfigDto,
  ) {}
}
