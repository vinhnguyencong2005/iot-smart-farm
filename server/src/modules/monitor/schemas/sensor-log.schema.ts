import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export type SensorLogDocument = SensorLog & Document;

@Schema({ collection: 'sensor_log', timestamps: true })
export class SensorLog {
  @Prop({ type: String, required: true, index: true })
  deviceId!: string; 

  @Prop({ type: String, required: true })
  mac!: string; 

  @Prop({ type: SchemaTypes.Mixed, required: true })
  data!: Record<string, any>; 

  @Prop({ type: Date, required: true, default: Date.now, index: true })
  timestamp!: Date; 
}

export const SensorLogSchema = SchemaFactory.createForClass(SensorLog);