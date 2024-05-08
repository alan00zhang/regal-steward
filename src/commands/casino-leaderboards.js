const { SlashCommandBuilder } = require('discord.js');
const utils = require('../utils.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('casino-leaderboards')
		.setDescription('Check out the casino leaderboard Top 5'),
	async execute(interaction, userAccount) {
    const system = interaction.client.system;
    let leaderboards = await system.bank.getCasinoLeaderboards();
    let top5 = leaderboards.slice(0, 5);
    let response = `**CASINO TOP 5 GAMBLING GODS**\n`;
    for (let i = 0; i < top5.length; i++) {
      response += `
      ${i+1}. <@${top5[i]["CAST(id as text)"]}>
      Total Winnings: ${utils.Units.bankPrefix} ${(top5[i].casino_winnings / 100).toLocaleString(undefined, {minimumFractionDigits: 2})}
      Total Losses: ${utils.Units.bankPrefix} ${(top5[i].casino_losses / 100).toLocaleString(undefined, {minimumFractionDigits: 2})}\n`;
    }
		await interaction.reply({
      content: response,
      allowedMentions: {parse: []}
    });
	},
};