const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { guardReply } = require('../utils');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('request-nickname')
		.setDescription('Request approval for a new nickname. Approval must be from nobility.'),
	async execute(interaction) {
		const requestingUser = interaction.member.displayName;
		let options = [];
		const higherPositions = interaction.guild.roles.cache.filter(role => {
			return interaction.member.roles.highest.comparePositionTo(role) <= 0;
		}).toJSON();
		for (let role of higherPositions) {
			options.push({
				label: role.name,
				value: role.id,
			})
		}
    const row = new ActionRowBuilder()
			.addComponents(
				new SelectMenuBuilder()
					.setCustomId(`nickname-approver-${interaction.user.id}`)
					.setPlaceholder('Nothing selected')
					.addOptions(...options),
			);
		await interaction.reply({ content: 'Request Approval From:', components: [row] });
		createApprovalButton(interaction, requestingUser);
	},
};

createApprovalButton = function(interaction, requestingUser) {
	interaction.client.once("interactionCreate", async interaction => {
		if (!interaction.isSelectMenu()) return;
		if (!guardReply(interaction)) return;

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId(`nickname-approval-${interaction.user.id}`)
					.setLabel("Approve")
					.setStyle(ButtonStyle.Primary)
			)

		await interaction.reply({
			content: `Approve @${requestingUser}'s Request?`,
			components: [row]
		})
	})
}