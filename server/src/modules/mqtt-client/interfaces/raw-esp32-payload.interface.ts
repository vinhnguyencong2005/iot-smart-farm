export class RawEsp32Payload {
  constructor(
    public readonly mac: string,
    public readonly data: {
      soil?: number;
      temp?: number;
      humid?: number;
      light?: number;
    },
  ) {}
}
