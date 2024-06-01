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
  [key: string]: T;
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

export type NumericRange<
  start extends number,
  end extends number,
  arr extends unknown[] = [],
  acc extends number = never,
> = arr['length'] extends end
  ? acc | start | end
  : NumericRange<start, end, [...arr, 1], arr[start] extends undefined ? acc : acc | arr['length']>;

// Casino types
export enum Suit { Diamonds, Clubs, Hearts, Spades }
export enum CardNumber { Ace = 1, Two, Three, Four, Five, Six, Seven, Eight, Nine, Ten, Jack, Queen, King }

export class Card {
  suit: Suit;
  number: CardNumber;
  constructor(suit: Suit, number: CardNumber) {
    this.suit = suit;
    this.number = number;
  }
  toString() {
    return `${CardNumber[this.number]} of ${Suit[this.suit]}`
  }
}

export class Deck {
  private _startingCards: Card[] = [];
  remainingCards: Card[] = [];
  constructor() {
    for (let suit of Object.values(Suit)) {
      for (let number of Object.values(CardNumber)) {
        typeof suit !== "string" && typeof number !== "string" && this._startingCards.push(new Card(suit, number));
      }
    }
    this.remainingCards = this._startingCards;
  }
  get cards() { return this.remainingCards }
  get length() { return this.remainingCards.length }
  draw() {
    return this.remainingCards.pop();
  }
  sort() {
    this.remainingCards.sort((a: Card, b: Card) => {
      return (a.number - b.number) + (a.suit - b.suit) * 100;
    });
  }
  shuffle() {
    this.remainingCards.sort(() => Math.random() - 0.5);
  }
  reset() {
    this.remainingCards = this._startingCards;
  }
}

export class Hand {
  cards: Card[] = [];
  draw(deck: Deck) {
    this.cards.push(deck.draw());
  }
  discard(card?: Card) {
    let index = card ? this.cards.indexOf(card) : 0
    this.cards.splice(index);
  }
  toString() {
    let str = ""
    for (let card of this.cards) {
      str += `|  ${card}  |`
    }
    return str;
  }
}