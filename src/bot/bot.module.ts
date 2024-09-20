import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../warranty/warranty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users])],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
