import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, GuildMember } from "discord.js";
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
    
    let dealer = Casino.requestDealer("blackjack");
    if (!dealer) {
      interaction.reply({
        content: `There's already a game of blackjack started in this channel.`,
        ephemeral: true
      });
      return;
    }

    const joinButton = new ButtonBuilder()
      .setCustomId("blackjack-join")
      .setLabel("Join")
      .setStyle(ButtonStyle.Success);

    let game = await interaction.reply({
      content: `Let's play a game of blackjack! Click below to join the table!`,
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton)]
    });

    // make collector! here

    // interaction.channel.send({
    //   content: `<@${member.id}> is playing a hand of blackjack...`
    // });

    const yourHand = dealer.sitDown();
    dealer.shuffle();

    // for (let i = 0; i < 5; ++i) {
    //   await Utils.delay(1000);
    //   dealer.deal(yourHand);
    //   let img = await Casino.displayCards(yourHand.cards);
    //   await game.edit({
    //     files: [img]
    //   })
    // }
  }
}
