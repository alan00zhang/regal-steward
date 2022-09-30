const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check-balance')
		.setDescription('Check your bank account balance.'),
	async execute(interaction) {
    const monies = await interaction.client.system.bank.getBalance(interaction.member.id)
    let response = `You have ${monies.bankAmount.toLocaleString()} Emporeum and ${monies.slumAmount.toLocaleString()} SlumCoin.`
		await interaction.reply({
      content: response,
      ephemeral: true
    });
	},
};