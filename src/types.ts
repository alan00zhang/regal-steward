import { ChatInputCommandInteraction, Interaction } from "discord.js";
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

export class EventOptions {
  name: string;
  id: string;
  eventFn: (interaction: Interaction) => void;
  duration: number = 30000;
  userId?: string;
}

export class SingletonCommand {
  system: System;
  id: string;
  constructor(system: System, id: string) {
    this.system = system;
    this.id = id;
  }
  close() {
    this.system.removeSingletonCommand(this.id);
  }
}