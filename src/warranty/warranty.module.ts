import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Warranty } from './warranty.entity';
import { WarrantyService } from './warranty.service';
import { WarrantyController } from './warranty.controller';
import { BotService } from '../bot/bot.service'

@Module({
  imports: [TypeOrmModule.forFeature([Warranty])],
  providers: [WarrantyService, BotService],
  controllers: [WarrantyController],
})
export class WarrantyModule {}
