import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class SensorConfig {
  @Prop({ type: Number, default: 0 })
  minThreshold: number = 0;

  @Prop({ type: Number, default: 4500 })
  maxThreshold: number = 4500;
}

export const SensorConfigSchema = SchemaFactory.createForClass(SensorConfig);
