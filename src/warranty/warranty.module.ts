import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users, Warranty } from './warranty.entity';
import { WarrantyService } from './warranty.service';
import { WarrantyController } from './warranty.controller';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [TypeOrmModule.forFeature([Warranty]), TypeOrmModule.forFeature([Users]), BotModule],
  providers: [WarrantyService],
  controllers: [WarrantyController],
})
export class WarrantyModule {}
