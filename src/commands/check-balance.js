const { SlashCommandBuilder } = require('discord.js');
const utils = require('../utils.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check-balance')
		.setDescription('Check your bank account balance.'),
	async execute(interaction, userAccount) {
    let response = `You have ${userAccount.bankBalance} ${utils.Units.bank} and ${userAccount.slumBalance} ${utils.Units.slum}.`
		await interaction.reply({
      content: response,
      ephemeral: true
    });
	},
};