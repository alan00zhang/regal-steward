import { Card } from "./card.js";
import { Deck } from "./deck.js";

export class Hand {
  cards: Card[] = [];
  draw(deck: Deck, hide?: boolean) {
    let card = deck.draw();
    if (hide) card.hide();
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
  reveal() {
    for (let card of this.cards) {
      card.show();
    }
  }
  conceal() {
    for (let card of this.cards) {
      card.hide();
    }
  }
}