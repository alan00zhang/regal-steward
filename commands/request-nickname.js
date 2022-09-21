const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const utils = require('../utils.js');
const systems = require('../systems.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('request-nickname')
		.setDescription('Request approval for a new nickname. Approval must be from nobility.')
		.addStringOption(option => 
			option.setName("nickname")
				.setDescription("Your desired new name.")
				.setRequired(true)),
	async execute(interaction) {
		const displayName = interaction.member.displayName;
		const options = await fetchApprovers(interaction);
		const approverRow = new ActionRowBuilder()
			.addComponents(new SelectMenuBuilder()
				.setCustomId(`nickname-approver-${interaction.user.id}`)
				.setPlaceholder('Who shall you beseech?')
				.addOptions(...options)
			)
		const submitRow = new ActionRowBuilder()
			.addComponents(new ButtonBuilder()
				.setCustomId(`approval-request-submit-${interaction.user.id}`)
				.setLabel("Submit Request")
				.setStyle(ButtonStyle.Primary)
			)
		const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.SelectMenu, time: utils.time.HOUR1 });
		collector.on('collect', i => {
			if (i.customId.startsWith(`nickname-approver`)) {
				if (utils.guardReply(i)) {
					
				}
			} else {
				i.deferUpdate();
			}
		});
		
		collector.on('end', collected => {
			console.log(`Collected ${collected.size} interactions.`);
		});
		await interaction.reply({ content: `${displayName} is begging to change their name to ${interaction.options.getString("nickname")}!`, components: [approverRow, submitRow] });
		const user = {
			displayName: displayName,
			id: interaction.user.id
		}
		createApprovalButton(interaction, user);
	},
};

fetchApprovers = async function(interaction) {
	const options = [];
	const higherRoles = interaction.guild.roles.cache.filter(role => {
		return interaction.member.roles.highest.comparePositionTo(role) <= 0;
	}).toJSON();
	const members = await interaction.guild.members.fetch();
	const approvers = members.filter(member => {
		return higherRoles.some(higherRole => member.roles.cache.find(role => role.name === higherRole.name))
	}).toJSON();
	for (let member of approvers) {
		options.push({
			label: member.displayName ? member.displayName : member.user.username,
			value: member.user.id
		})
	}
	return options;
}

createApprovalButton = function(interaction, user) {
	systems.awaitCustomEventById(interaction.client, "approval-request-submit", user.id, async i => {
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId(`nickname-approval-${i.user.id}`)
					.setLabel("Approve")
					.setStyle(ButtonStyle.Primary)
			)

		await i.reply({
			content: `Approve @${user.displayName}'s Request?`,
			components: [row]
		})
	})
}