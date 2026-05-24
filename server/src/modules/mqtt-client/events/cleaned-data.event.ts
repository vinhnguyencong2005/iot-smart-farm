export class CleanedDataEvent {
  constructor(
    public readonly deviceId: string,
    public readonly macAddress: string,
    public readonly timestamp: Date,
    public readonly readings: Record<string, number>,
  ) {}
}
