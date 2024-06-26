import { UniqueKeySystemDatabase } from "../systems/database.js";
import { Suit, CardNumber, CasinoGame } from "../types.js";
import { Utils } from "../utils.js";
import { SystemService } from "./service.js";
import { Card } from "../components/casino/card.js";
import { Dealer } from "../components/casino/dealer.js";
import { Deck } from "../components/casino/deck.js";

export class CasinoService extends SystemService {
  dealers: UniqueKeySystemDatabase<Dealer>;
  cardWidth = 150;
  cardHeight = 150;
  service(): void {
    this.dealers = new UniqueKeySystemDatabase("dealers", "id");
  }

  requestDealer(game: CasinoGame) {
    let dealer: Dealer;
    switch (game) {
      case "blackjack":
        dealer = new Dealer(game, this, new Deck(4));
        break;
      case "roulette":
        dealer = new Dealer(game, this);
        break;
      case "poker":
        dealer = new Dealer(game, this, new Deck(4));
        break;
    }
    this.dealers.store(dealer);
    return dealer;
  }

  displayCards(cards: Card[]) {
    let paths = [];
    for (let card of cards) {
      if (!card.hidden) {
        paths.push(
          `cards/${CardNumber[card.number].toLowerCase()}_of_${Suit[card.suit].toLowerCase()}.png`,
        );
      } else {
        paths.push(`cards/card_back.png`);
      }
    }
    return Utils.getImage(paths, 100, 150, 10);
  }
}
