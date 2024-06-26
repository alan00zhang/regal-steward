import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from 'discord.js';
import { System } from '../systems/systems.js';
import { AppCommand } from '../types.js';
import { UNITS } from '../constants.js';

export const CommandCheckBalance: AppCommand = {
	async execute(interaction: ChatInputCommandInteraction, system: System) {
		let userBankAccount = await system.bank.getUserAccount((<GuildMember>interaction.member).id);
    let response = `You have ${userBankAccount.bankBalanceString} ${UNITS.bank}`;
		await interaction.reply({
      content: response,
      ephemeral: true
    });
	},
};