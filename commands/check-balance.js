const { SlashCommandBuilder } = require('discord.js');
const utils = require('../utils.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check-balance')
		.setDescription('Check your bank account balance.'),
	async execute(interaction, userAccount) {
    const monies = await interaction.client.system.bank.getBalance(interaction.member.id)
    let response = `You have ${monies.bankAmount.toLocaleString(undefined, {minimumFractionDigits: 2})} ${utils.Units.bank} and ${monies.slumAmount.toLocaleString()} ${utils.Units.slum}.`
		await interaction.reply({
      content: response,
      ephemeral: true
    });
	},
};