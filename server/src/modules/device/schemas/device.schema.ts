import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

import { SensorType } from '../enums/config.enums';
import { SensorConfig, SensorConfigSchema } from './sensor-config.schema';
import { PumpConfig, PumpConfigSchema } from './pump-config.schema';

@Schema({ _id: true, timestamps: true })
export class Device extends Document {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true,
  })
  macAddress!: string;

  @Prop({
    type: Map,
    of: SensorConfigSchema,
    default: () => ({}),
  })
  sensorConfigs!: Map<SensorType, SensorConfig>;

  @Prop({
    type: PumpConfigSchema,
    default: () => ({}),
  })
  pumpConfig!: PumpConfig;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

export type DeviceDocument = HydratedDocument<Device>;
