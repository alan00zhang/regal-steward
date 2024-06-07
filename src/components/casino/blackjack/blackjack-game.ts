import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, InteractionCollector, InteractionResponse, Message } from "discord.js";
import { CasinoService } from "../../../services/casino-service.js";
import { Utils } from "../../../utils.js";
import { CardNumber, SingletonCommand } from "../../../types.js";
import { BehaviorSubject, Subject, Subscription } from "rxjs";
import { BLACKJACK_VALUES } from "../../../constants.js";
import { Dealer } from "../dealer.js";
import { Hand } from "../hand.js";
import { BankAccount } from "../../../systems/bank.js";

export class BlackjackGame {
  interaction: InteractionResponse;
  Casino: CasinoService;
  dealer: Dealer;
  hand: Hand;
  message: Message;
  finished$ = new BehaviorSubject<boolean | string>(false);
  score$ = new BehaviorSubject<number>(undefined);
  collector: InteractionCollector<ButtonInteraction>;
  bet: number;
  userAccount: BankAccount;
  private subscriptions = new Subscription();
  constructor(casino: CasinoService, dealer: Dealer, interaction: InteractionResponse, bet?: number, userAccount?: BankAccount) {
    this.interaction = interaction;
    this.Casino = casino;
    this.dealer = dealer;
    this.bet = bet;
    this.userAccount = userAccount;
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
  async dealIn(dealerGame: BlackjackDealerGame) {
    this.hand = this.dealer.getHand();
    for (let i = 0; i < 2; ++i) {
      await Utils.delay(1000);
      await this.hit();
    }
    await Utils.delay(1000);
    this.startCollector();
    let dealerHasBlackjack = await this.subscribeToDealer(dealerGame);
    if (dealerHasBlackjack !== "blackjack") {
      if (this.total === 21) {
        this.blackjack();
        return;
      }
      this.displayButtons();
    }
  }
  private async startCollector() {
    this.collector = this.message.createMessageComponentCollector({ componentType: ComponentType.Button, time: Utils.Time.MINUTE5});
    this.collector.on("collect", async interaction => {
      if (interaction.customId === ("hit")) {
        let total = await this.hit();
        if (total > 21) {
          this.bust();
        } else if (total === 21) {
          this.stand();
        }
      } else if (interaction.customId === "stand") {
        this.stand();
      }
    })
    this.collector.on("ignore", () => {
      this.finished$.next(true);
      this.score$.next(-this.bet)
    });
  }
  async hit() {
    this.dealer.deal(this.hand);
    let total = this.total;
    let img = await this.Casino.displayCards(this.hand.cards);
    this.message = await this.interaction.edit({
      content: `Your hand (total: ${total})`,
      files: [img]
    });
    return total;
  }
  async stand() {
    this.finished$.next(true);
    await this.interaction.edit({
      content: `Waiting for all players to finish. Your total: ${this.total}`,
      components: []
    });
    this.collector.stop();
  }
  async bust() {
    this.finished$.next(true);
    await this.interaction.edit({
      content: `BUST! You lost this hand.`,
      components: []
    });
    this.collector.stop();
    this.endGame(-this.bet);
  }
  async blackjack() {
    this.finished$.next(true);
    await this.interaction.edit({
      content: `BLACKJACK BABY! You win!`,
      components: []
    });
    this.collector.stop();
    this.endGame(this.bet * 1.5);
  }
  async displayButtons() {
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
    this.message = await this.interaction.edit({
      components: [row]
    })
  }
  async subscribeToDealer(game: BlackjackDealerGame) {
    this.subscriptions.add(game.finished$.subscribe(value => {
      if (value) {
        if (value === "bust") {
          this.payout();
        } else if (value === "blackjack") {
          this.lose(true);
        } else {
          if (game.total > this.total) {
            this.lose();
          } else if (game.total === this.total) {
            this.push();
          } else {
            this.payout();
          }
        }
      }
    }));
    return game.finished$.value;
  }
  private async push() {
    this.message = await this.interaction.edit({
      content: `Huh, it's a tie.`
    });
    this.endGame(0);
  }
  private async payout() {
    this.message = await this.interaction.edit({
      content: `You win!`
    });
    this.endGame(this.bet);
  }
  private async lose(blackjack: boolean = false) {
    if (blackjack) {
      if (this.total === 21) {
        await this.interaction.edit({
          content: `Dealer blackjack... but you also had blackjack. Saved.`
        });
        this.endGame(0);
        return;
      }
      await this.interaction.edit({
        content: `Dealer blackjack... never even stood a chance.`
      });
      this.endGame(-this.bet)
      return
    }
    await this.interaction.edit({
      content: `Dealer has a higher total than you. You lose! You lose!`
    });
    this.endGame(-this.bet);
  }
  async endGame(score: number) {
    this.score$.next(score);
    this.subscriptions.unsubscribe();
  }
}

export class BlackjackDealerGame extends BlackjackGame {
  command: SingletonCommand;
  constructor(Casino: CasinoService, dealer: Dealer, interaction: InteractionResponse, command: SingletonCommand) {
    super(Casino, dealer, interaction);
    this.command = command;
  }
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
  get realTotal() {
    let total = 0;
    for (let card of this.dealer.cards) {
      let value: number;
      if (card.number !== CardNumber.Ace) {
        value = BLACKJACK_VALUES[card.number];
      } else {
        value = total < 11 ? 11 : 1;
      }
      total += value;
    }
    return total;
  }
  async dealerStart() {
    let content = `The game has started! Good luck.`
    this.message = await this.interaction.interaction.channel.send({
      content: content
    });
    for (let i = 0; i < 2; ++i) {
      await Utils.delay(1000);
      this.dealer.draw(this.dealer.deck, i === 0);
      let img = await this.Casino.displayCards(this.dealer.cards);
      this.message = await this.message.edit({
        content: content += ".",
        files: [img]
      });
    }
    await Utils.delay(1000);
    if (this.realTotal === 21) {
      this.blackjack();
    } else {
      this.message = await this.message.edit({
        content: `Dealer's hand (total: ${this.total})`
      });
    }
  }
  async reveal() {
    await Utils.delay(1000);
    this.dealer.reveal();
    let img = await this.Casino.displayCards(this.dealer.cards);
    this.message = await this.message.edit({
      content: `All games finished. Dealer reveals hand. (total: ${this.total})`,
      files: [img]
    });
    // Dealer "AI" starts here
    await Utils.delay(2000);
    while (this.total <= 16) {
      await this.hit();
      await Utils.delay(1000);
    }
    if (this.total > 21) {
      this.bust();
    } else {
      this.stand();
    }
  }
  async hit(hide?: boolean) {
    this.dealer.draw(this.dealer.deck, hide);
    let img = await this.Casino.displayCards(this.dealer.cards);
    this.message = await this.message.edit({
      content: `Dealer hits. (total: ${this.total})`,
      files: [img]
    });
    return this.total;
  }
  async stand() {
    this.finished$.next(true);
    this.message = await this.message.edit({
      content: `Dealer stands. (total: ${this.total})`
    })
  }
  async bust() {
    this.finished$.next("bust");
    this.message = await this.message.edit({
      content: `Dealer busts! Everyone left wins!`
    });
  }
  async blackjack() {
    this.finished$.next("blackjack");
    this.dealer.reveal();
    let img = await this.Casino.displayCards(this.dealer.cards);
    this.message = await this.message.edit({
      content: `Dealer blackjack!`,
      files: [img]
    });
  }
  async endGame() {
    this.dealer.closeTable();
    this.command.close();
  }
}