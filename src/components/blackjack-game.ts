import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, InteractionResponse, Message } from "discord.js";
import { CasinoService, Dealer, Hand } from "../services/casino-service.js";
import { Utils } from "../utils.js";
import { CardNumber } from "../types.js";
import { BehaviorSubject } from "rxjs";

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
  async dealIn() {
    this.hand = this.dealer.getHand();
    let message: Message;
    for (let i = 0; i < 2; ++i) {
      await Utils.delay(1000);
      message = await this.hit();
    }
    let collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: Utils.Time.MINUTE15});
    collector.on("collect", async interaction => {
      if (interaction.customId === "hit") {
        this.hit();
        // interaction.update({});
      } else if (interaction.customId === "stand") {
        this.stand();
        await this.interaction.edit({
          content: `Waiting for all players to finish`
        })
      }
    })
  }
  async dealerStart() {
    let content = `The game has started! Welcome to the torture chamber. Dealer's hand (total: ${this.dealer.getBlackjackTotal(this.dealer)})`
    let dealerMsg = await this.interaction.interaction.channel.send({
      content: content
    })
    for (let i = 0; i < 2; ++i) {
      await Utils.delay(1000);
      this.dealer.draw(this.dealer.deck, i === 0);
      let img = await this.Casino.displayCards(this.dealer.cards);
      dealerMsg = await dealerMsg.edit({
        content: content,
        files: [img]
      });
    }
    this.dealerMsg = dealerMsg;
  }
  async dealerEnd() {
    this.dealer.reveal();
    let img = await this.Casino.displayCards(this.dealer.cards);
    await this.dealerMsg.edit({
      files: [img]
    })
  }
  async hit() {
    let hitButton = new ButtonBuilder()
    .setCustomId("hit")
    .setLabel("Hit")
    .setStyle(ButtonStyle.Primary)
    let standButton = new ButtonBuilder()
      .setCustomId("stand")
      .setLabel("Stand")
      .setStyle(ButtonStyle.Secondary)
    let row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(hitButton, standButton)
    
    this.dealer.deal(this.hand);
    let img = await this.Casino.displayCards(this.hand.cards);
    return this.interaction.edit({
      content: `Your hand (total: ${this.dealer.getBlackjackTotal(this.hand)})`,
      components: [row],
      files: [img]
    });
  }
  async stand() {
    this.finished.next(true);
  }
}