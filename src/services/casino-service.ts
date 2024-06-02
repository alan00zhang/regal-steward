import { Suit, CardNumber } from "../types.js";
import { SystemService } from "./service.js";

export class CasinoService extends SystemService {
  service(): void {
      
  }
}

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
      str += `|  ${card}  | `
    }
    return str;
  }
}