import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { Utils } from '../utils.js';
import { System } from '../systems/systems.js';
import { AppCommand } from '../types.js';
import { BankAccount } from '../systems/bank.js';

// The price of betting on a jackpot roll once

export const CommandJackpot: AppCommand = {
	async execute(interaction: ChatInputCommandInteraction, system: System) {
		let member = <GuildMember>interaction.member;
		let bankAccount = await system.bank.getUserAccount(member.id);
		const banker = await system.bank.getUserAccount("bank");
		let betCost = Math.round(banker.bankBalance) / 100;
		// cap the betCost at 100,000.00
		if (betCost > 100000.00) betCost = 100000.00;
		if (interaction.options.getSubcommand() === "check") {
			let response = `The jackpot is currently valued at ${Utils.Units.bankPrefix} ${banker.bankBalanceString}.
			The cost of a jackpot bet is ${Utils.Units.bankPrefix} ${Utils.formatCurrency(betCost)}.`;
			await interaction.reply({
				content: response,
				ephemeral: true
			});
		} else { // subcommand is "bet"
			if (bankAccount.bankBalance < betCost) {
				await interaction.reply({
					content: "You can't afford that.",
					ephemeral: true
				});
				return;
			}
			await bankAccount.subtractBank(betCost * 100);
			let roll = Math.floor(Math.random() * 100) + 1;
			let response = `<@${member.id}> is taking a chance at the jackpot!\n\nThey rolled a ${roll === 100 ? "⭐100⭐!!!" : roll}\n`;
			if (roll === 100) {
				let jackpot = banker.bankBalance;
				await bankAccount.addBank(banker.userData.bank_amount);
				await bankAccount.addCasinoWinnings(banker.userData.bank_amount);
				await banker.subtractBank(banker.userData.bank_amount);
				response += `**Congratulations! <@${member.id}> just won the BIG POT of ${Utils.Units.bankPrefix} ${jackpot}!!!**`
			} else if (roll > 90) {
				await bankAccount.addCasinoLosses(betCost * 100);
				response += `🇱 Soo close... try again?`
			} else {
				await bankAccount.addCasinoLosses(betCost * 100);
				response += `🇱 That's tough... better luck next time.`
			}
			await interaction.reply({
				content: response
			});
			await interaction.followUp({
				content: `You have ${Utils.formatCurrency(bankAccount.bankBalance)} ${Utils.Units.bank} left in your account.`,
				ephemeral: true
			});
		}
	},
};