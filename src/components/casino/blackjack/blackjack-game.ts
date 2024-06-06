import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, InteractionResponse, Message } from "discord.js";
import { CasinoService } from "../../../services/casino-service.js";
import { Utils } from "../../../utils.js";
import { CardNumber } from "../../../types.js";
import { BehaviorSubject } from "rxjs";
import { BLACKJACK_VALUES } from "../../../constants.js";
import { Dealer } from "../dealer.js";
import { Hand } from "../hand.js";

export class BlackjackGame {
  interaction: InteractionResponse;
  Casino: CasinoService;
  dealer: Dealer;
  dealerMsg?: Message;
  hand: Hand;
  finished = new BehaviorSubject<boolean>(false);
  constructor(casino: CasinoService, dealer: Dealer, interaction: InteractionResponse) {
    this.interaction = interaction;
    this.Casino = casino;
    this.dealer = dealer;
  }
  get total() {
    let total = 0;
    for (let card of this.hand.cards) {
      let value: number;
      if (card.hidden) {
        value = 0;
      } else if (card.number !== CardNumber.Ace) {
        value = BLACKJACK_VALUES[card.number];
      } else {
        value = total < 11 ? 11 : 1;
      }
      total += value;
    }
    return total;
  }
  async dealIn() {
    this.hand = this.dealer.getHand();
    let message: Message;
    for (let i = 0; i < 2; ++i) {
      await Utils.delay(1000);
      message = await this.hit() as Message;
    }
    let collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: Utils.Time.MINUTE15});
    collector.on("collect", async interaction => {
      if (interaction.customId === ("hit")) {
        if (!await this.hit()) {
          this.bust();
          collector.stop();
        }
      } else if (interaction.customId === "stand") {
        this.stand();
        collector.stop();
      }
    })
  }
  async hit() {
    let hitButton = new ButtonBuilder()
    .setCustomId(`hit`)
    .setLabel("Hit")
    .setStyle(ButtonStyle.Primary)
    let standButton = new ButtonBuilder()
      .setCustomId("stand")
      .setLabel("Stand")
      .setStyle(ButtonStyle.Secondary)
    let row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(hitButton, standButton)
    
    this.dealer.deal(this.hand);
    let total = this.total;
    let img = await this.Casino.displayCards(this.hand.cards);
    let message = await this.interaction.edit({
      content: `Your hand (total: ${total})`,
      components: [row],
      files: [img]
    });
    return total < 21 ? message : false;
  }
  async stand() {
    this.finished.next(true);
    await this.interaction.edit({
      content: `Waiting for all players to finish`,
      components: []
    });
  }
  async bust() {
    this.finished.next(true);
    await this.interaction.edit({
      content: `BUST! You lost this hand.`,
      components: []
    });
  }
  async blackjack() {
    this.finished.next(true);
    await this.interaction.edit({
      content: `BLACKJACK BABY! You win!`,
      components: []
    });
  }
}

export class BlackjackDealer extends BlackjackGame {
  get total() {
    let total = 0;
    for (let card of this.dealer.cards) {
      let value: number;
      if (card.hidden) {
        value = 0;
      } else if (card.number !== CardNumber.Ace) {
        value = BLACKJACK_VALUES[card.number];
      } else {
        value = total < 11 ? 11 : 1;
      }
      total += value;
    }
    return total;
  }
  async dealerStart() {
    let content = `The game has started! Welcome to the torture chamber.`
    let dealerMsg = await this.interaction.interaction.channel.send({
      content: content
    });
    for (let i = 0; i < 2; ++i) {
      await Utils.delay(1000);
      this.dealer.draw(this.dealer.deck, i === 0);
      let img = await this.Casino.displayCards(this.dealer.cards);
      dealerMsg = await dealerMsg.edit({
        content: content += ".",
        files: [img]
      });
    }
    await Utils.delay(1500);
    dealerMsg = await dealerMsg.edit({
      content: `Dealer's hand (total: ${this.total})`
    });
    this.dealerMsg = dealerMsg;
  }
  async dealerEnd() {
    this.dealer.reveal();
    let img = await this.Casino.displayCards(this.dealer.cards);
    await this.dealerMsg.edit({
      content: `Dealer's hand (total: ${this.total})`,
      files: [img]
    });
  }
}