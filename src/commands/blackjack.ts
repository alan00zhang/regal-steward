import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { AppCommand, Deck, Hand } from "../types.js";
import { System } from "../systems/systems.js";
import { Utils } from "../utils.js";

export const CommandBlackjack: AppCommand = {
  async execute(interaction: ChatInputCommandInteraction, system: System) {
    const bet = Math.round(interaction.options.getNumber("bet") * 1e2) / 1e2; // round to .00 decimals
    let member = <GuildMember>interaction.member;
    let userAccount = await system.bank.getUserAccount(member.id);
    if (userAccount.bankBalance < bet || bet < 0) {
      await interaction.reply({
        content: "You can't afford that.",
        ephemeral: true
      });
      return;
    }
    const command = system.createSingletonCommand(interaction);
		if (command === false) return;
    
    let game = await interaction.reply({
      content: `Dealing you in...`,
      ephemeral: true
    });
    interaction.channel.send({
      content: `<@${member.id}> is playing a hand of blackjack...`
    });

    const deck = new Deck();
    deck.shuffle();
    const yourHand = new Hand();
    const dealerHand = new Hand();

    for (let i = 0; i < 2; ++i) {
      await Utils.delay(1000);
      yourHand.draw(deck);
      dealerHand.draw(deck);
      await game.edit(`${"Your hand:".padEnd(20)} ${yourHand}` + `\n${"Dealer's hand:".padEnd(20)} ${dealerHand}`);
    }
  }
}
