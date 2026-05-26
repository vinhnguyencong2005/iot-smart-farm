import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class PumpConfig {
  @Prop({ type: Number, default: 60000 }) // 1 minute cooldown
  cooldownMs: number = 60000;

  @Prop({ type: Number, default: 5000 }) // Run for 5 seconds by default
  defaultRunTimeMs: number = 5000;
}

export const PumpConfigSchema = SchemaFactory.createForClass(PumpConfig);
