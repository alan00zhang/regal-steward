const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const utils = require('../utils.js');
const systemsJs = require('../systems.js');

fetchApprovers = async function(interaction) {
	// find roles higher than the user's
	const options = [];
	const higherRoles = interaction.guild.roles.cache.filter(role => {
		return interaction.member.roles.highest.comparePositionTo(role) <= 0;
	}).toJSON();

	// find members with any of the higher roles
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

	// return higher members
	return options;
}

createApprovalListener = function(interaction, user, collector) {
	const eventFn = async i => {
		collector.stop();

		const approverId = collector.collected.last().values[0];
		const approver = await i.guild.members.fetch(approverId);

		// construct ActionRow with Approve and Reject buttons
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId(`nickname-approval-${approverId}`)
					.setLabel("Approve")
					.setStyle(ButtonStyle.Primary)
			)

			.addComponents(
				new ButtonBuilder()
					.setCustomId(`nickname-rejection-${approverId}`)
					.setLabel("Reject")
					.setStyle(ButtonStyle.Danger)
			)

		await i.reply({
			content: `${approver.user.username} Approve @${user.displayName}'s Request?`,
			components: [row]
		})

		// wait for approval/rejection
		processRequest(i, approverId, user.id, interaction.options.getString("nickname"))
	}
	const eventOptions = systemsJs.createEventOptions("approval-request-submit", user.id, eventFn, utils.Time.MINUTE15, user.id);
	const	commandId = `request-nickname-${user.id}`;
	return systemsJs.awaitCustomEventById(interaction.client, eventOptions, commandId)
}

processRequest = function(interaction, approverId, beggarId, nickname) {
	const eventFn = async i => {
		const [approver, beggar] = await Promise.all([i.guild.members.fetch(approverId), i.guild.members.fetch(beggarId)])
		let isApproved = i.customId.includes("approval") ? true : false;
		let content = `<@${approverId}> has ${isApproved ? "approved" : "rejected"} the supplicant <@${beggarId}>'s request!`;
		if (isApproved) {
			content += `\n${beggar.displayName ? beggar.displayName : beggar.user.username } will be renamed to ${nickname}`;
			try {
				beggar.setNickname(nickname);
			} catch (error) {
				console.error(error);
			}
		}
		i.reply({
			content: content,
			ephemeral: true
		})
	}
	const eventOptions = systemsJs.createEventOptions([`nickname-approval`, `nickname-rejection`], approverId, eventFn, utils.Time.DAY1, approverId)
	const	commandId = `request-nickname-${beggarId}`;
	systemsJs.awaitCustomEventById(interaction.client, eventOptions, commandId);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('request-nickname')
		.setDescription('Request approval for a new nickname. Approval must be from nobility.')
		.addStringOption(option => 
			option.setName("nickname")
				.setDescription("Your desired new name.")
				.setRequired(true)),

	async execute(interaction, system) {
		const commandId = utils.initSingletonCommand(interaction, system)
		if (!commandId) return;
		const displayName = interaction.member.displayName;
		const options = await fetchApprovers(interaction);

		// construct ActionRow with dropdown menu listing members who are authorized to approve requests
		const approverRow = new ActionRowBuilder()
			.addComponents(new SelectMenuBuilder()
				.setCustomId(`nickname-approver-${interaction.user.id}`)
				.setPlaceholder('Who shall you beseech?')
				.addOptions(...options)
			)

		// construct ActionRow for submitting the request to the selected member
		const submitRow = new ActionRowBuilder()
			.addComponents(new ButtonBuilder()
				.setCustomId(`approval-request-submit-${interaction.user.id}`)
				.setLabel("Submit Request")
				.setStyle(ButtonStyle.Primary)
			)

		// create an InteractionCollector that watches and updates the dropdown menu whenever an option is selected,
		// also updates the message with the Submit Request button
		const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.SelectMenu, time: utils.Time.DAY1 });
		let listener;
		let listenSuccess = false;
		collector.on('collect', async i => {
			if (i.customId.startsWith(`nickname-approver`)) {
				if (utils.guardReply(i)) {
					// display the clicked option as the selected value
					const userId = i.values[0];
					let newOptions = structuredClone(options)
					let selectedOption = newOptions.find(option => option.value === userId)
					selectedOption.default = true;

					// reconstruct the select menu, this time updating the selected value 
					const updatedSelectMenu = new ActionRowBuilder()
						.addComponents(new SelectMenuBuilder()
							.setCustomId(`nickname-approver-${interaction.user.id}`)
							.addOptions(...newOptions)
					)
					// update the select menu with selected value and render a submit button with id of beggar
					await i.update({components: [updatedSelectMenu, submitRow]})
					// create user object to verify who sent the original request
					let user = {
						displayName: displayName,
						id: interaction.user.id
					}
					if (listener) {
						listener.close();
					}
					// wait for beggar to submit request
					listener = createApprovalListener(interaction, user, collector);
				}
			} else if (i.customId.startsWith(`approval-request-submit`)) {
				if (utils.guardReply(i)) {
					listenSuccess = true;
					collector.stop();
				}
			} else {
				i.deferReply();
			}
		});

		collector.on('end', collected => {
			if (!listenSuccess) system.dbActiveEvents.removeById(commandId);
		});

		await interaction.reply({ content: `${displayName} is begging to change their name to ${interaction.options.getString("nickname")}!`, components: [approverRow] });
	},
};