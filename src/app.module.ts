/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramBotService } from './telegram-bot';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService,TelegramBotService],
})
export class AppModule {}
