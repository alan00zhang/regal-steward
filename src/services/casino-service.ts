import { UniqueKeySystemDatabase, UniqueSystemDatabase } from "../systems/database.js";
import { Suit, CardNumber, CasinoGame } from "../types.js";
import { Utils } from "../utils.js";
import { SystemService } from "./service.js";

export class CasinoService extends SystemService {
  dealers: UniqueKeySystemDatabase<"game">
  cardWidth = 150;
  cardHeight = 150;
  service(): void {
    this.dealers = new UniqueKeySystemDatabase("dealers", "game");
  }

  requestDealer(game: CasinoGame) {
    if (!this.dealers.has(game)) {
      let dealer: Dealer;
      switch (game) {
        case "blackjack":
          dealer = new Dealer("blackjack", this, new Deck(4));
          this.dealers.store(dealer);
          break;
          case "roulette":
          dealer = new Dealer("roulette", this);
          this.dealers.store(dealer);
          break;
          case "poker":
          dealer = new Dealer("poker", this, new Deck(4));
          this.dealers.store(dealer);
          break;
      }
      return dealer;
    } else {
      return false;
      // return this.dealers.getByID(game) as Dealer;
    }
  }

  displayCards(cards: Card[]) {
    let paths = [];
    for (let card of cards) {
      if (!card.hidden) {
        paths.push(`cards/${CardNumber[card.number].toLowerCase()}_of_${Suit[card.suit].toLowerCase()}.png`);
      } else {
        paths.push(`cards/card_back.png`);
      }
    }
    return Utils.getImage(paths, 100, 150, 10);
  }
}

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

export class Dealer extends Hand {
  game: CasinoGame;
  Casino: CasinoService;
  deck: Deck;
  hands: Hand[];
  constructor(game: CasinoGame, Casino: CasinoService, deck?: Deck) {
    super();
    this.game = game;
    this.Casino = Casino;
    this.deck = deck;
    this.hands = [];
  }
  deal(hand: Hand) {
    hand.draw(this.deck);
  }
  shuffle() {
    this.deck.shuffle();
  }
  reset() {
    this.deck.reset();
  }
  getHand() {
    let hand = new Hand();
    this.hands.push(hand);
    return hand;
  }
  closeTable() {
    this.Casino.dealers.deleteByID(this.game);
  }
}