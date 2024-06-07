import { Suit, CardNumber } from "../../types.js";
import { Card } from "./card.js";

export class Deck {
  private _startingCards: Card[] = [];
  remainingCards: Card[] = [];
  constructor(shoes: number) {
    for (let i = 0; i < shoes; ++i) {
      for (let suit of Object.values(Suit)) {
        for (let number of Object.values(CardNumber)) {
          typeof suit !== "string" && typeof number !== "string" && this._startingCards.push(new Card(suit, number));
        }
      }
    }
    this.remainingCards = this._startingCards;
    this.sort();
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
    this.sort();
  }
}