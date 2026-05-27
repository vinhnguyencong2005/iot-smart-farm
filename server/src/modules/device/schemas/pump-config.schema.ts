import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TriggerCondition } from '../enums/config.enums';

@Schema({ _id: false })
class PumpTrigger {
  @Prop({ type: String, required: true, default: 'soil_moisture' })
  type: string = 'soil_moisture';

  @Prop({
    type: String,
    required: true,
    enum: TriggerCondition,
    default: TriggerCondition.LESS_THAN,
  })
  condition: TriggerCondition = TriggerCondition.LESS_THAN;

  @Prop({ type: Number, required: true, default: 40 })
  value: number = 40;
}

const PumpTriggerSchema = SchemaFactory.createForClass(PumpTrigger);

@Schema({ _id: false })
export class PumpConfig {
  @Prop({ type: Boolean, default: true })
  enabled: boolean = true;

  @Prop({ type: [PumpTriggerSchema], default: () => [] })
  trigger!: PumpTrigger[];

  @Prop({ type: Number, default: 5000 })
  defaultRunTimeMs: number = 5000;

  @Prop({ type: Number, default: 60000 })
  cooldownMs: number = 60000;

  @Prop({ type: Date, default: null })
  lastTriggered: Date | null = null;
}

export const PumpConfigSchema = SchemaFactory.createForClass(PumpConfig);