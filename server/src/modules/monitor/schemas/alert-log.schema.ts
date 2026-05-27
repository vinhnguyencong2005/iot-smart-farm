import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

@Schema({ collection: 'alert_logs', timestamps: true })
export class AlertLog extends Document {
  @Prop({ required: true })
  device_id!: string;

  @Prop({ type: String, default: null })
  sensor_log_id!: string | null;

  @Prop({ required: true })
  sensor_type!: string;

  @Prop({ type: Number, required: true })
  value!: number;

  @Prop({ required: true })
  status!: string; // 'low' hoặc 'high'

  @Prop({ required: true })
  message!: string;

  @Prop({ required: true, default: 'ENV' })
  type!: string;

  @Prop({ type: Date, default: Date.now })
  timestamp!: Date;
}

export const AlertLogSchema = SchemaFactory.createForClass(AlertLog);
export type AlertLogDocument = HydratedDocument<AlertLog>;