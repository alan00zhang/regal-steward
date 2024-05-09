import { ChatInputCommandInteraction } from "discord.js";
import { System } from "./systems/systems.js";

export type UserAccount = {
  id: string;
  bank_amount: number;
  casino_winnings: number;
  casino_losses: number;
  username: string;
  salary: number;
  meme_earnings: number;
  [key: string]: any;
}

export type AppCommand = {
  execute: (interaction: ChatInputCommandInteraction, system: System) => any
}

export type KeyValuePair<T> = {
  [key: string]: T
}