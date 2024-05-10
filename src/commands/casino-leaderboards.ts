import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Utils } from '../utils.js';
import { System } from '../systems/systems.js';
import { AppCommand } from '../types.js';

export const CommandCasinoLeaderboards: AppCommand = {
	async execute(interaction: ChatInputCommandInteraction, system: System) {
    let leaderboards = await system.bank.getCasinoLeaderboards();
    let top5 = leaderboards.slice(0, 5);
    let response = `**CASINO TOP 5 GAMBLING GODS**\n`;
    for (let i = 0; i < top5.length; i++) {
      response += `
      ${i+1}. <@${top5[i]["CAST(id as text)"]}>
      Total Winnings: ${Utils.Units.bankPrefix} ${Utils.formatCurrency(top5[i]['casino_winnings'] as number)}
      Total Losses: ${Utils.Units.bankPrefix} ${Utils.formatCurrency(top5[i]['casino_losses'] as number)}\n`;
    }
		await interaction.reply({
      content: response,
      allowedMentions: {parse: []}
    });
	},
};