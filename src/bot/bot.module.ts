import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../warranty/warranty.entity';
import { TelegrafModule } from 'nestjs-telegraf';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users]),
    TelegrafModule.forRoot({
      token: process.env.BOT_TOKEN,
    }),
  ],
  providers: [BotService],
  exports: [BotService],
})

export class BotModule {}