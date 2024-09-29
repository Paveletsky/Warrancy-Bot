import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FileCleanupService } from './schedule.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Warranty } from '../warranty/warranty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Warranty]), ScheduleModule.forRoot()],
  providers: [FileCleanupService],
})
export class FileCleanupModule {}
