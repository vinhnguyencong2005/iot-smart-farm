import { TriggerSource, PumpStatus } from '../enums/pump.enums';

export interface PumpLogDto {
  traceId: string;
  device_id: string;
  duration: number;
  source: TriggerSource;
  status?: PumpStatus;
  timestamp: Date;
}
