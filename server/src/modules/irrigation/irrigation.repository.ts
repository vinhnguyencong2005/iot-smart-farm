import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PumpLog, PumpLogDocument } from './schemas/pump-log.schema';
import { PumpConfig, PumpConfigDocument } from './schemas/pump-config.schema';
import { AlertLog, AlertLogDocument } from './schemas/alert-log-schema';
import { isErrorCode } from '../../common/utils/type-guards.util';

@Injectable()
export class IrrigationRepository {
  private readonly logger = new Logger(IrrigationRepository.name);
}
