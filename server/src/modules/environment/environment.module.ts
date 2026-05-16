import { Module } from '@nestjs/common';
import { EnvironmentRepository } from './environment.repository';
import { DataCleanerService } from './data-cleaner.service';

@Module({
  providers: [EnvironmentRepository, DataCleanerService],
})
export class EnvironmentModule {}
