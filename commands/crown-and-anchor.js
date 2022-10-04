const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const systemsJs = require('../systems.js');
const utils = require('../utils.js');

const commandName = "crown-and-anchor";
const outcomes = [
  {label: "Crowns", value: "crown"},
  {label: "Anchors", value: "anchor"},
  {label: "Hearts", value: "hearts"},
  {label: "Clubs", value: "clubs"},
  {label: "Diamonds", value: "diamonds"},
  {label: "Spades", value: "spades"}
];
const roll = () => {
  return outcomes[Math.floor(Math.random() * outcomes.length)].value;
}

// Process the suit selection and render a Start Game button
runGame = (interaction, collector, listenSuccess, bet) => {
  let betterId = interaction.member.id;
  const eventFn = async i => {
    if (!await utils.guardReply(i, commandName)) return;
    listenSuccess.status = true;
		collector.stop();

    let [r1, r2, r3] = [roll(), roll(), roll()];
    let response = `You rolled... \n:${r1}: :${r2}: :${r3}:`;
      await i.reply({
        content: `Rolling...`,
        ephemeral: true
      });
      
      setTimeout(async () => {
        await i.followUp({
          content: response,
          ephemeral: true
        });
        
        let wins = [r1, r2, r3].filter(x => x === bet.selectedSuit).length;

        if (wins) {
          let winAmount = (wins + 1) * bet.amount;
          await Promise.all([
            bet.userAccount.addBank(winAmount * 100),
            bet.userAccount.addCasinoWinnings(winAmount * 100)
          ]);
        } else {
          await Promise.all([
            bet.userAccount.subtractBank(bet.amount * 100),
            bet.userAccount.addCasinoLosses(bet.amount * 100)
          ]);
        }

        let finalResponse = `Your suit came up ${wins} times.\n`
        finalResponse += wins ? `You won ${(wins + 1) * bet.amount} ${utils.Units.bank}!` : `You lose! You lose!`;
        finalResponse += `\nYou have ${bet.userAccount.bankBalance} ${utils.Units.bank} left in your account.`
        i.followUp({
          content: finalResponse,
          ephemeral: true
        });

        let name = i.member.displayName ? i.member.displayName : i.user.username;
        let announcement = wins 
        ? `${name} has won ${(wins + 1) * bet.amount} ${utils.Units.bank} playing Crown and Anchor!` 
        : `${name} has lost ${bet.amount} ${utils.Units.bank} playing Crown and Anchor!`;
        i.channel.send(announcement)
      }, 1000);
  }
  const eventOptions = systemsJs.createEventOptions("caa-start", betterId, eventFn, utils.Time.MINUTE5, betterId);
  const	commandOptions = {
    id: `${commandName}-${betterId}`,
    removeAfterSuccess: true
  };
  return systemsJs.awaitCustomEventById(interaction.client, eventOptions, commandOptions);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('crown-and-anchor')
		.setDescription('Play a game of Crown and Anchor!')
    .addNumberOption(option => 
      option.setName("bet")
        .setDescription(`How much ${utils.Units.bank} will you wager?`)
        .setRequired(true)),
	async execute(interaction, userAccount) {
    const bet = interaction.options.getNumber("bet").toFixed(2);
    if (userAccount.userData.bank_amount / 100 < bet || bet < 0) {
      await interaction.reply({
        content: "You can't afford that.",
        ephemeral: true
      });
      return;
    }
    const commandId = await utils.initSingletonCommand(interaction, interaction.client.system)
		if (!commandId) return;

    let listenSuccess = {};
    let suitSelectId = `caa-suit-select-${interaction.member.id}`
    const betOptionRow = utils.createSelectMenu(
      suitSelectId, 
      outcomes,
      // outcomes.map(outcome => outcome[0] = outcome[0].toUpperCase()),
      "Pick a suit"
    );

    // create an InteractionCollector that watches and updates the dropdown menu whenever an option is selected,
		// also updates the message with the Submit Request button
		const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.SelectMenu, time: utils.Time.MINUTE5 });
		let listener;
		collector.on('collect', async i => {
			if (i.customId === suitSelectId) {
				if (await utils.guardReply(i, commandName)) {
          // construct ActionRow with Start Game button
          const startGameRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`caa-start-${interaction.member.id}`)
              .setLabel("Roll the Dice")
              .setStyle(ButtonStyle.Success)
              .setEmoji("🎲")
          );
          
					// display the clicked option as the selected value
					selectedSuit = i.values[0];
					const updatedSuitSelectRow = utils.createUpdatedSelectMenu(suitSelectId, outcomes, selectedSuit);
					let components = [updatedSuitSelectRow, startGameRow];

          await i.update({
            content: `What suit do you bet on?`,
            components: components,
            ephemeral: true
          });

          let betInfo = {
            userAccount: userAccount,
            amount: bet,
            selectedSuit: selectedSuit
          }
				
          if (listener) {
            listener.close();
          }
          // wait for better to begin game
          listener = runGame(interaction, collector, listenSuccess, betInfo);
        }
			}
		});

    collector.once('end', collected => {
			if (!listenSuccess.status) interaction.client.system.dbActiveEvents.removeById(commandId);
		});

		await interaction.reply({
      content: `What suit do you bet on?`,
      components: [betOptionRow],
      ephemeral: true
    });
	},
};