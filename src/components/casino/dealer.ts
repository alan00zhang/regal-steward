import { CasinoService } from "../../services/casino-service.js";
import { CasinoGame } from "../../types.js";
import { Deck } from "./deck.js";
import { Hand } from "./hand.js";

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