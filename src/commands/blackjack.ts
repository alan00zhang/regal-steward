import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { AppCommand } from "../types.js";
import { System } from "../systems/systems.js";
import { Utils } from "../utils.js";
import { Deck, Hand } from "../services/casino-service.js";

export const CommandBlackjack: AppCommand = {
  async execute(interaction: ChatInputCommandInteraction, system: System) {
    const bet = Math.round(interaction.options.getNumber("bet") * 1e2) / 1e2; // round to .00 decimals
    let member = <GuildMember>interaction.member;
    let userAccount = await system.bank.getUserAccount(member.id);
    const Casino = system.Casino;
    if (userAccount.bankBalance < bet || bet < 0) {
      await interaction.reply({
        content: "You can't afford that.",
        ephemeral: true
      });
      return;
    }
    // const command = system.createSingletonCommand(interaction);
		// if (command === false) return;
    
    let game = await interaction.reply({
      content: `Dealing you in...`,
      ephemeral: true
    });
    // interaction.channel.send({
    //   content: `<@${member.id}> is playing a hand of blackjack...`
    // });

    const deck = new Deck();
    deck.shuffle();
    const yourHand = new Hand();
    const dealerHand = new Hand();
    // yourHand.draw(deck)
    // const img = await Casino.getCardPng(yourHand.cards[0].suit, yourHand.cards[0].number);
    // interaction.followUp({
    //   files: [img, img, img],
    //   ephemeral: true
    // })
    let files = []

    for (let i = 0; i < 5; ++i) {
      await Utils.delay(1000);
      let yCard = yourHand.draw(deck);
      let dCard = dealerHand.draw(deck);
      let img = await Casino.displayCards(yourHand.cards);
      await game.edit({
        files: [img]
      })
      // await game.edit(`${"Your hand:".padEnd(20)} ${yourHand}` + `\n${"Dealer's hand:".padEnd(20)} ${dealerHand}`);
    }
  }
}
