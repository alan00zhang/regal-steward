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

export type KeyValuePair<Key extends string | number | symbol, T> = {
  [key in Key]: T;
}

export type PrimaryKeyObject<Key extends string> = KeyValuePair<Key, any> & { [k: string]: any }

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

export type NumericRange<
  start extends number,
  end extends number,
  arr extends unknown[] = [],
  acc extends number = never,
> = arr['length'] extends end
  ? acc | start | end
  : NumericRange<start, end, [...arr, 1], arr[start] extends undefined ? acc : acc | arr['length']>;

export enum Suit { Diamonds, Clubs, Hearts, Spades }
export enum CardNumber { Ace = 1, Two, Three, Four, Five, Six, Seven, Eight, Nine, Ten, Jack, Queen, King }

export type CasinoGame = "blackjack" | "roulette" | "poker"