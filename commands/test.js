const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('testing'),
	async execute(interaction) {
    await interaction.deferReply();
    await interaction.deleteReply();
		// await interaction.reply('Hellow Worldo');
	},
};