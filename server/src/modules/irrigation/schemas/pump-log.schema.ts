import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TriggerSource, PumpStatus } from '../enums/pump.enums';

export type PumpLogDocument = HydratedDocument<PumpLog>;

@Schema()
export class PumpLog {
  @Prop({ required: true, index: true })
  traceId!: string;

  @Prop({ type: Types.ObjectId, ref: 'Device', required: true })
  device_id!: Types.ObjectId;

  @Prop({ required: true, enum: TriggerSource })
  trigger_source!: string;

  @Prop({ required: true, enum: PumpStatus })
  status!: string;

  @Prop({ required: true })
  duration!: number;

  @Prop({ required: true })
  timestamp!: Date;
}

export const PumpLogSchema = SchemaFactory.createForClass(PumpLog);
