import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ChatInputCommandInteraction, GuildMember } from 'discord.js';
const systemsJs = require('../systems/systems.js').default;
import { Utils } from '../utils.js';
import { System } from '../systems/systems.js';
import { AppCommand } from '../types.js';

const commandName = "crown-and-anchor";
const outcomes = ["Crowns", "Anchors", "Spades", "Hearts", "Clubs", "Diamonds"];
const roll = () => {
  return outcomes[Math.floor(Math.random() * outcomes.length)].toLowerCase();
}

// Process the suit selection and render a Start Game button
// runGame = (interaction, collector, listenSuccess, bet) => {
//   let betterId = interaction.member.id;
//   const eventFn = async i => {
//     if (!await utils.guardReply(i, commandName)) return;
//     listenSuccess.status = true;
// 		collector.stop();

//     let [r1, r2, r3] = [roll(), roll(), roll()];
//     let response = `<@${i.member.id}> is playing a game of Crown and Anchor\n\nThey picked ${bet.selectedSuit}! \nThey rolled... \n:${r1}: :${r2}: :${r3}:`;

//     await i.reply({
//       content: response,
//     });
    
//     let wins = [r1, r2, r3].filter(x => x === bet.selectedSuit).length;
//     let banker = await interaction.client.system.bank.getUserAccount("bank");

//     if (wins) {
//       var winAmount;
//       switch (wins) {
//         case 1:
//           winAmount = bet.amount * 100;
//           await Promise.all([
//             bet.userAccount.addBank(winAmount),
//             bet.userAccount.addCasinoWinnings(winAmount)
//           ]);
//           break;

//         case 2:
//           winAmount = Math.round((bet.amount * 2.5 * 100));
//           await Promise.all([
//             bet.userAccount.addBank(winAmount),
//             bet.userAccount.addCasinoWinnings(winAmount)
//           ]);
//           break;

//         case 3:
//           winAmount = bet.amount * 5 * 100;
//           await Promise.all([
//             bet.userAccount.addBank(winAmount),
//             bet.userAccount.addCasinoWinnings(winAmount)
//           ]);
//       }
//     } else {
//       await Promise.all([
//         bet.userAccount.subtractBank(bet.amount * 100),
//         bet.userAccount.addCasinoLosses(bet.amount * 100),
//         banker.addBank(bet.amount * 100)
//       ]);
//     }

//     let finalResponse = `Your suit came up ${wins} times.\n`
//     finalResponse += wins ? `You won ${(winAmount / 100).toLocaleString(undefined, {minimumFractionDigits: 2})} ${utils.Units.bank}!` : `You lose! You lose!`;
//     finalResponse += `\nYou have ${utils.Units.bankPrefix} ${bet.userAccount.bankBalance} left in your account.`
//     await i.followUp({
//       content: finalResponse,
//       ephemeral: true
//     });

//     let announcement = wins 
//     ? `<@${i.member.id}> has won ${utils.Units.bankPrefix} ${(winAmount / 100).toLocaleString(undefined, {minimumFractionDigits: 2})} playing Crown and Anchor!` 
//     : `<@${i.member.id}> has lost ${utils.Units.bankPrefix} ${Number(bet.amount).toLocaleString(undefined, {minimumFractionDigits: 2})} playing Crown and Anchor!`;
//     announcement += `\n\nThere is ${utils.Units.bankPrefix} ${banker.bankBalance} in the jackpot.`
//     i.channel.send(announcement)
//   }
//   const eventOptions = systemsJs.createEventOptions("caa-start", betterId, eventFn, utils.Time.MINUTE5, betterId);
//   const	commandOptions = {
//     id: `${commandName}-${betterId}`,
//     removeAfterSuccess: true
//   };
//   return systemsJs.awaitCustomEventById(interaction.client, eventOptions, commandOptions);
// }

export const CommandCrownAndAnchor: AppCommand = {
	async execute(interaction: ChatInputCommandInteraction, system: System) {
    const bet = Math.round(interaction.options.getNumber("bet") * 1e2) / 1e2; // round to .00 decimals
    let member = <GuildMember>interaction.member;
    let bankAccount = await system.bank.getUserAccount(member.id);
    if (bankAccount.bankBalance < bet || bet < 0) {
      await interaction.reply({
        content: "You can't afford that.",
        ephemeral: true
      });
      return;
    }
    const commandId = await system.createSingletonCommand(interaction);
		if (!commandId) return;

    let listenSuccess = {};
    let suitSelectId = `caa-suit-select-${member.id}`
    const suitSelectMenu = Utils.createSelectMenu(
      suitSelectId, 
      outcomes,
      "Pick a suit"
    );
    const suitSelect = await interaction.reply({
      content: `Which suit do you place your bet on?`,
      components: [suitSelectMenu],
      ephemeral: true
    });

    // create an InteractionCollector that watches and updates the dropdown menu whenever an option is selected,
		// also updates the message with the Start Game button
		const collector = suitSelect.createMessageComponentCollector(
      { componentType: ComponentType.StringSelect, time: Utils.Time.MINUTE5 }
    );
		let listener;
		collector.on('collect', async i => {
				if (await system.guardReply(i, commandName)) {
          const startGameRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`caa-start-${member.id}`)
              .setLabel("Roll the Dice")
              .setStyle(ButtonStyle.Success)
              .setEmoji("🎲")
          );
          
					// display the clicked option as the selected value
					let selectedSuit = i.values[0];
					const updatedSuitSelectRow = Utils.createUpdatedSelectMenu(suitSelectId, outcomes, selectedSuit);
          await i.update({
            content: `What suit do you bet on?`,
            components: [updatedSuitSelectRow, startGameRow]
          });

          

          let betInfo = {
            userAccount: bankAccount,
            amount: bet,
            selectedSuit: selectedSuit
          }
				
          // if (listener) {
          //   listener.close();
          // }
          // wait for better to begin game
          // listener = runGame(interaction, collector, listenSuccess, betInfo);
        }
			
		});

    // collector.once('end', collected => {
		// 	if (!listenSuccess.status) interaction.client.system.dbActiveEvents.removeById(commandId);
		// });
	}
};