/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import * as cron from 'node-cron';
import { config } from 'dotenv';
config(); // Load environment variables from .env file


// Replace with your Telegram bot token
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const CITY = process.env.CITY;


// Interface to represent the expected structure of the weather API response
interface WeatherResponse {
  weather: {
    description: string;
  }[];
  main: {
    temp: number;
  };
}

@Injectable()
export class TelegramBotService {
  private bot: TelegramBot;
  private subscribedUsers: Set<number> = new Set<number>();

  constructor() {
    
    this.bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

    // Load subscribed users from a database or storage on startup
    // For simplicity, we'll use an in-memory Set here
    // In a real application, consider using a database for persistent storage
    this.loadSubscribedUsers();

    // Register bot commands
    this.registerCommands();

    // Schedule the sendWeatherUpdates function to run every hour
    cron.schedule('0 * * * *', () => {
        console.log("sending update");
        
      this.sendWeatherUpdatesToAll();
    });
  }

  private registerCommands() {
    console.log("hello");
    
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(
        chatId,
        'Welcome!\nUse /subscribe to subscribe to weather updates or /unsubscribe to stop receiving updates.',
      );
    });

    this.bot.onText(/\/subscribe/, (msg) => {
      const chatId = msg.chat.id;
      if (this.subscribedUsers.has(chatId)) {
        this.bot.sendMessage(chatId, 'You are already subscribed.');
      } else {
        this.subscribedUsers.add(chatId);
        this.bot.sendMessage(
          chatId,
          'You are now subscribed to weather updates here.',
        );
        console.log("calling function");
        
        this.sendWeatherUpdate(chatId);
      }
    });

    this.bot.onText(/\/unsubscribe/, (msg) => {
      const chatId = msg.chat.id;
      if (this.subscribedUsers.has(chatId)) {
        this.subscribedUsers.delete(chatId);
        this.bot.sendMessage(
          chatId,
          'You have unsubscribed from weather updates.',
        );
      } else {
        this.bot.sendMessage(chatId, 'You are not subscribed.');
      }
    });
  }

  private async sendWeatherUpdate(chatId: number) {

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}`,
      );

      if (!response.ok) {
        Logger.error('Failed to fetch weather data');
        return;
      }

      const data: WeatherResponse = (await response.json()) as WeatherResponse;

      const weatherDescription = data.weather[0]?.description;
      const temperature = (data.main?.temp - 273.15)?.toFixed(2); // Convert to Celsius

      const message = `Weather in ${CITY}:\n${weatherDescription}\nTemperature: ${temperature}°C`;

      this.bot.sendMessage(chatId, message);
    } catch (error) {
      Logger.error('Error fetching weather data', error);
    }
  }

  private async sendWeatherUpdatesToAll() {
    // This function sends weather updates to all subscribed users
    for (const chatId of this.subscribedUsers) {
      this.sendWeatherUpdate(chatId);
    }
  }

  private loadSubscribedUsers() {
    // Load subscribed users from a database or storage on startup
    // For simplicity, we're using an in-memory Set here
    // In a real application, replace this with your storage logic
  }
}
