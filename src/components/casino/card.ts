import { Suit, CardNumber } from "../../types.js";

export class Card {
  suit: Suit;
  number: CardNumber;
  hidden: boolean = false;
  constructor(suit: Suit, number: CardNumber) {
    this.suit = suit;
    this.number = number;
  }
  show() { this.hidden = false }
  hide() { this.hidden = true }
  toString() {
    return `${CardNumber[this.number]} of ${Suit[this.suit]}`
  }
}