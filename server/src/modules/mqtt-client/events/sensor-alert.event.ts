export class SensorAlertEvent {
  constructor(
    public readonly deviceId: string,
    public readonly violations: Array<{
      sensor_type: string;
      value: number;
      status: string;
      message: string;
    }>,
  ) {}
}