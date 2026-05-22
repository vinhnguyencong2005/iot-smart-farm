import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PumpCondition } from '../enums/pump.enums';
import { SensorType } from '../enums/sensor.enums';

export type PumpConfigDocument = HydratedDocument<PumpConfig>;

// Condition for triggering the pump
class PumpTrigger {
  @Prop({ required: true, enum: SensorType })
  type!: string;

  @Prop({ required: true, enum: PumpCondition })
  condition!: PumpCondition;

  @Prop({ required: true })
  value!: number;
}

@Schema({ timestamps: true })
export class PumpConfig {
  @Prop({
    type: Types.ObjectId,
    ref: 'Device',
    required: true,
    index: true,
  })
  device_id!: Types.ObjectId;

  @Prop({ required: true })
  enabled!: boolean;

  @Prop({ type: [PumpTrigger], required: true })
  triggers!: PumpTrigger[];

  @Prop({ required: true })
  duration!: number;

  @Prop({ required: true })
  cooldown!: number;

  @Prop()
  last_triggered?: Date;
}

export const PumpConfigSchema = SchemaFactory.createForClass(PumpConfig);
