import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { AppCommand, Card, Deck, NumericRange } from "../types.js";
import { System } from "../systems/systems.js";

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
    
    await interaction.reply({
      content: `<@${member.id}> is playing a hand of blackjack...`
    });

    const deck = new Deck();
    deck.shuffle();

    let game = await interaction.followUp({
      content: ``,
      ephemeral: true
    })
  }
}

