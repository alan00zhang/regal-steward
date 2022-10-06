const { SlashCommandBuilder } = require('discord.js');
const utils = require('../utils.js');

// The price of betting on a jackpot roll once
const betCost = 10000;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('jackpot')
		.setDescription('Check the current jackpot value OR make a bet to take the whole damn thing.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('check')
				.setDescription(`Check what the current jackpot value is in ${utils.Units.bank}.`))
		.addSubcommand(subcommand =>
			subcommand
				.setName('bet')
				.setDescription(`For ${betCost / 100} ${utils.Units.bank}, roll a number from 1-200 and hit 200 to win the ⭐JACKPOT⭐`)),
	async execute(interaction, userAccount) {
		const banker = await interaction.client.system.bank.getUserAccount("bank");
		if (interaction.options.getSubcommand() === "check") {
			let response = `The jackpot is currently valued at ${utils.Units.bankPrefix} ${banker.bankBalance}. Will you take the gamble?`;
			await interaction.reply({
				content: response,
				ephemeral: true
			});
		} else { // subcommand is "bet"
			if (userAccount.userData.bank_amount < betCost) {
				await interaction.reply({
					content: "You can't afford that.",
					ephemeral: true
				});
				return;
			}
			await userAccount.subtractBank(betCost);
			let roll = Math.floor(Math.random() * 200) + 1;
			let response = `<@${interaction.member.id}> is taking a chance at the jackpot!\n\nThey rolled a ${roll === 200 ? "⭐200⭐!!!" : roll}\n`;
			if (roll === 200) {
				let jackpot = banker.bankBalance;
				await userAccount.addBank(banker.userData.bank_amount);
				await banker.subtractBank(banker.userData.bank_amount);
				response += `**Congratulations! <@${interaction.member.id}> just won the BIG POT of ${utils.Units.bankPrefix} ${jackpot}!!!**`
			} else if (roll > 180) {
				response += `🇱 So close... try again?`
			} else {
				response += `🇱 That's tough.. better luck next time.`
			}
			await interaction.reply({
				content: response
			});
			await interaction.followUp({
				content: `You have ${userAccount.bankBalance} ${utils.Units.bank} left in your account.`,
				ephemeral: true
			});
		}
	},
};