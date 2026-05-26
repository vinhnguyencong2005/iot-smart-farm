import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PumpLogDocument = PumpLog & Document;

@Schema({ collection: 'pump_log', timestamps: true })
export class PumpLog {
  @Prop({ type: String, required: true, index: true })
  deviceId!: string;

  @Prop({ type: String, required: true })
  mac!: string;

  @Prop({ type: Number, required: true })
  durationMs!: number;

  @Prop({ type: String, enum: ['MANUAL', 'ENV', 'SCHEDULE'], required: true })
  source!: string; 

  @Prop({ type: Date, required: true, default: Date.now, index: true })
  timestamp!: Date;
}

export const PumpLogSchema = SchemaFactory.createForClass(PumpLog);