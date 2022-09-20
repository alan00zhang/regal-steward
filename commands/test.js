const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('testing'),
	async execute(interaction) {
    let canApprove = interaction
    console.log(interaction.member.roles.cache.some(role => role.name === 'Admin'))
    await interaction.deferReply();
    await interaction.deleteReply();
		// await interaction.reply('Hellow Worldo');
	},
};