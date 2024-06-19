import { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { Utils } from '../utils.js';
import { System } from '../systems/systems.js';
import { AppCommand } from '../types.js';
import { UNITS } from '../constants.js';

export const CommandJackpot: AppCommand = {
	async execute(interaction: ChatInputCommandInteraction, system: System) {
		let member = <GuildMember>interaction.member;
		let bankAccount = await system.bank.getUserAccount(member.id);
		const banker = await system.bank.getUserAccount("bank");
		let betCost = Math.round(banker.bankBalance) / 100;
		// cap the betCost at 100,000.00
		if (betCost > 100_000.00) betCost = 100_000.00;
		if (interaction.options.getSubcommand() === "check") {
			let response = `The jackpot is currently valued at ${UNITS.bankPrefix} ${banker.bankBalanceString}.
			The cost of a jackpot bet is ${UNITS.bankPrefix} ${Utils.formatCurrency(betCost)}.`;
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
			await bankAccount.subtractBank(betCost);
			let roll = Math.floor(Math.random() * 100) + 1;
			let response = `<@${member.id}> is taking a chance at the jackpot!\n\nThey rolled a ${roll === 100 ? "⭐100⭐!!!" : roll}\n`;
			if (roll === 100) {
				await bankAccount.addBank(banker.bankBalance);
				await bankAccount.addCasinoWinnings(banker.bankBalance);
				await banker.subtractBank(banker.bankBalance);
				response += `**Congratulations! <@${member.id}> just won the BIG POT of ${UNITS.bankPrefix} ${banker.bankBalanceString}!!!**`
			} else if (roll > 90) {
				await bankAccount.addCasinoLosses(betCost);
				response += `🇱 Soo close... try again?`
			} else {
				await bankAccount.addCasinoLosses(betCost);
				response += `🇱 That's tough... better luck next time.`
			}
			await interaction.reply({
				content: response
			});
			await interaction.followUp({
				content: `You have ${Utils.formatCurrency(bankAccount.bankBalance)} ${UNITS.bank} left in your account.`,
				ephemeral: true
			});
		}
	},
};