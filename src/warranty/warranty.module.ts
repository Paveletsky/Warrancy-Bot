import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Warranty } from './warranty.entity';
import { WarrantyService } from './warranty.service';
import { WarrantyController } from './warranty.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Warranty])],
  providers: [WarrantyService],
  controllers: [WarrantyController],
})
export class WarrantyModule {}
