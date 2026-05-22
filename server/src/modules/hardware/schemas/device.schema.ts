import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DeviceStatus } from '../enums/device.enums';
import { HydratedDocument } from 'mongoose';

export type DeviceDocument = HydratedDocument<Device>;

@Schema({ timestamps: true })
export class Device {
  // The physical hardware identifier (e.g., A1:B2:C3:D4:E5:F6)
  @Prop({ required: true, unique: true, index: true })
  mac_address!: string;

  @Prop({ required: true, default: 'My Smart Farm' })
  name!: string;

  @Prop({
    required: true,
    enum: Object.values(DeviceStatus),
    default: DeviceStatus.UNCLAIMED,
  })
  status!: DeviceStatus;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
