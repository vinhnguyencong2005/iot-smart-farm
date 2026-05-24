export class IrrigationCommandDispatchEvent {
  constructor(
    public readonly macAddress: string,
    public readonly durationMs: number,
  ) {}
}
