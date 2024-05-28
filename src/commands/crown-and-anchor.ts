import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ChatInputCommandInteraction, GuildMember, Interaction, APISelectMenuOption } from 'discord.js';
import { Utils } from '../utils.js';
import { System } from '../systems/systems.js';
import { AppCommand } from '../types.js';

const commandName = "crown-and-anchor";
const outcomes: APISelectMenuOption[] = [
  { label: "Crowns", value: "crown" },
  { label: "Anchors", value: "anchor" },
  { label: "Spades", value: "spades" },
  { label: "Hearts", value: "hearts" },
  { label: "Clubs", value: "clubs" },
  { label: "Dimaonds", value: "diamonds" },
]
const roll = () => {
  return outcomes[Math.floor(Math.random() * outcomes.length)].value;
}

export const CommandCrownAndAnchor: AppCommand = {
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

    let suitSelectId = `caa-suit-select-${member.id}`
    const suitSelectMenu = Utils.createSelectMenu(
      suitSelectId, 
      outcomes,
      "Pick a suit"
    );
    const suitPicker = await interaction.reply({
      content: `Which suit do you place your bet on?`,
      components: [suitSelectMenu],
      ephemeral: true
    });

    // create an InteractionCollector that watches and updates the dropdown menu whenever an option is selected,
		// also updates the message with the Start Game button
    let selectedSuit: string;
		const collector = suitPicker.createMessageComponentCollector(
      { componentType: ComponentType.StringSelect, time: Utils.Time.MINUTE5 }
    );
		collector.on('collect', async i => {
      const startGameRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`caa-start`)
          .setLabel("Roll the Dice")
          .setStyle(ButtonStyle.Success)
          .setEmoji("🎲")
      );
      
      // display the clicked option as the selected value
      selectedSuit = i.values[0];
      const updatedSuitSelectRow = Utils.createUpdatedSelectMenu(suitSelectId, outcomes, selectedSuit);
      await i.update({
        content: `What suit do you bet on?`,
        components: [updatedSuitSelectRow, startGameRow]
      });
		});
    // GAME STARTED
    try {
      let gameStart = await suitPicker.awaitMessageComponent({filter: async i => i.customId === "caa-start", time: 5000});
  
      let [r1, r2, r3] = [roll(), roll(), roll()];
      let response = `<@${member.id}> is playing a game of Crown and Anchor\n\nThey picked ${selectedSuit}! \nThey rolled... \n:${r1}: :${r2}: :${r3}:`;
  
      await gameStart.reply({
        content: response,
        ephemeral: true
      });

      let wins = [r1, r2, r3].filter(x => x === selectedSuit).length;
      const banker = await system.bank.getUserAccount("bank");

      if (wins) {
        var winAmount;
        switch (wins) {
          case 1:
            winAmount = bet;
            await Promise.all([
              userAccount.addBank(winAmount),
              userAccount.addCasinoWinnings(winAmount)
            ]);
            break;
  
          case 2:
            winAmount = bet * 3;
            await Promise.all([
              userAccount.addBank(winAmount),
              userAccount.addCasinoWinnings(winAmount)
            ]);
            break;
  
          case 3:
            winAmount = bet * 10;
            await Promise.all([
              userAccount.addBank(winAmount),
              userAccount.addCasinoWinnings(winAmount)
            ]);
        }
      } else {
        await Promise.all([
          userAccount.subtractBank(bet),
          userAccount.addCasinoLosses(bet),
          banker.addBank(bet)
        ]);
      }
      let finalResponse = `Your suit came up ${wins} times.\n`
      finalResponse += wins ? `You won ${Utils.formatCurrency(winAmount)} ${Utils.Units.bank}!` : `You lose! You lose!`;
      finalResponse += `\nYou have ${Utils.Units.bankPrefix} ${userAccount.bankBalanceString} left in your account.`
      await gameStart.followUp({
        content: finalResponse,
        ephemeral: true
      });
  
      let announcement = wins 
      ? `<@${member.id}> has won ${Utils.Units.bankPrefix} ${Utils.formatCurrency(winAmount)} playing Crown and Anchor!` 
      : `<@${member.id}> has lost ${Utils.Units.bankPrefix} ${Utils.formatCurrency(winAmount)} playing Crown and Anchor!`;
      announcement += `\n\nThere is ${Utils.Units.bankPrefix} ${banker.bankBalanceString} in the jackpot.`
      interaction.channel.send(announcement);
    } catch {
      interaction.editReply({ content: 'You did not select a suit in time, exiting game...', components: [] });
      collector.stop();
    } finally {
      command.close();
    }
	}
};