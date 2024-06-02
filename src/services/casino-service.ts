import { UniqueSystemDatabase } from "../systems/database.js";
import { Suit, CardNumber } from "../types.js";
import { Utils } from "../utils.js";
import { SystemService } from "./service.js";

export class CasinoService extends SystemService {
  dealers: UniqueSystemDatabase<string>;
  cardWidth = 150;
  cardHeight = 150;
  service(): void {
    this.dealers = new UniqueSystemDatabase<string>("dealers");
  }

  requestDealer(game: string) {

  }

  displayCards(cards: Card[]) {
    let paths = [];
    for (let card of cards) {
      paths.push(`cards/${CardNumber[card.number]}_of_${Suit[card.suit]}.png`);
    }
    return Utils.getImage(paths, 100, 150);
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
    let card = deck.draw();
    this.cards.push(card);
    return card;
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

export class Dealer extends Hand {
  
}