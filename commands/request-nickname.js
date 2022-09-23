const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const utils = require('../utils.js');
const systemsJs = require('../systems.js');

var selectedApproverId, selectedVictimId;
fetchApprovers = async function(interaction) {
	// find eligible approver members
	const options = [];
	const members = await interaction.guild.members.fetch();
	const approvers = members.filter(member => {
		return member.roles.cache.find(role => role.name === "Nobility");
		// comment above code to switch the approvers
		// from only "Nobility" to all members who are higher in rank
		return member.roles.highest.comparePositionTo(interaction.member.roles.highest) > 0;
	}).toJSON();
	for (let member of approvers) {
		if (!member.user.bot) options.push({
			label: member.displayName ? member.displayName : member.user.username,
			value: member.user.id
		})
	}
	// return higher members
	return options;
}

fetchVictims = async function(interaction) {
	// find members lower than or equal to user
	const options = [];
	const members = await interaction.guild.members.fetch();
	const victims = members.filter(member => {
		return member.roles.highest.comparePositionTo(interaction.member.roles.highest) <= 0;
	}).toJSON();
	for (let member of victims) {
		if (!member.user.bot) options.push({
			label: member.displayName ? member.displayName : member.user.username,
			value: member.user.id
		})
	}
	// return lower or equal members
	return options;
}

createApprovalListener = function(interaction, beggar, collector, listenSuccess) {
	const eventFn = async i => {
		if (!utils.guardReply(i)) return;
		listenSuccess.status = true;
		collector.stop();
		const approver = await i.guild.members.fetch(selectedApproverId);

		// construct ActionRow with Approve and Reject buttons
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId(`nickname-approval-${selectedApproverId}`)
					.setLabel("Approve")
					.setStyle(ButtonStyle.Primary)
			)

			.addComponents(
				new ButtonBuilder()
					.setCustomId(`nickname-rejection-${selectedApproverId}`)
					.setLabel("Reject")
					.setStyle(ButtonStyle.Danger)
			)

		await i.reply({
			content: `<@${approver.user.id}>, will you approve <@${beggar.id}>'s Request?`,
			components: [row]
		})

		// wait for approval/rejection
		processRequest(i, selectedApproverId, beggar.id, interaction.options.getString("nickname"))
	}
	const eventOptions = systemsJs.createEventOptions("approval-request-submit", beggar.id, eventFn, utils.Time.MINUTE15, beggar.id);
	const	commandOptions = {
		id: `request-nickname-${beggar.id}`
	};
	return systemsJs.awaitCustomEventById(interaction.client, eventOptions, commandOptions)
}

processRequest = function(interaction, approverId, beggarId, nickname) {
	const eventFn = async i => {
		const [victim, beggar] = await Promise.all([i.guild.members.fetch(selectedVictimId), i.guild.members.fetch(beggarId)])
		let isApproved = i.customId.includes("approval") ? true : false;
		let content = `<@${approverId}> has ${isApproved ? "approved" : "rejected"} the supplicant <@${beggarId}>'s request!`;
		if (isApproved) {
			content += `\n${victim.displayName ? victim.displayName : victim.user.username } will be renamed to ${nickname}`;
			try {
				victim.setNickname(nickname);
			} catch (error) {
				throw new Error(error);
			}
		}
		i.reply({
			content: content
		})
	}
	const eventOptions = systemsJs.createEventOptions([`nickname-approval`, `nickname-rejection`], approverId, eventFn, utils.Time.DAY1, approverId)
	const	commandOptions = {
		id: `request-nickname-${beggarId}`,
		removeAfterSuccess: true
	};
	systemsJs.awaitCustomEventById(interaction.client, eventOptions, commandOptions);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('request-nickname')
		.setDescription('Request approval for a new nickname. Approval must be from nobility.')
		.addStringOption(option => 
			option.setName("nickname")
				.setDescription("What should the new nickname be?")
				.setRequired(true)),

	async execute(interaction, system) {
		const commandId = await utils.initSingletonCommand(interaction, system)
		if (!commandId) return;
		selectedApproverId = "";
		selectedVictimId = "";
		const displayName = interaction.member.displayName;
		var approverOptions = await fetchApprovers(interaction);
		var victimOptions = await fetchVictims(interaction);
		const listenSuccess = {};

		// construct ActionRow with dropdown menu listing members who are authorized to approve requests
		let chooseVictimEventId = `nickname-victim-${interaction.user.id}`;
		const victimRow = utils.createSelectMenu(chooseVictimEventId, victimOptions, "Who shall you bestow your gift upon?")

		// construct ActionRow with dropdown menu listing members who are authorized to approve requests
		let chooseApproverEventId = `nickname-approver-${interaction.user.id}`;
		const approverRow = utils.createSelectMenu(chooseApproverEventId, approverOptions, "Who shall you beseech?")

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
		collector.on('collect', async i => {
			if (i.customId.startsWith(`nickname-approver`)) {
				if (utils.guardReply(i)) {
					// display the clicked option as the selected value
					selectedApproverId = i.values[0];
					const updatedApproverRow = utils.createUpdatedSelectMenu(`nickname-approver-${interaction.user.id}`, approverOptions, selectedApproverId);
					let components = [victimRow, updatedApproverRow];

					if (selectedVictimId) {
						// reconstruct victim select menu with selected option
						// render submit button as well
						const updatedVictimRow = utils.createUpdatedSelectMenu(`nickname-victim-${interaction.user.id}`, victimOptions, selectedVictimId);
						components = [updatedVictimRow, updatedApproverRow, submitRow];
						await i.update({ 
							content: `<@${interaction.user.id}> is begging to change <@${selectedVictimId}> name to ${interaction.options.getString("nickname")}!`,
							components: components
						});
					} else {
						await i.update({components: components})
					}
					
					if (selectedApproverId && selectedVictimId) {
						// create beggar object to verify who sent the original request
						let beggar = {
							displayName: displayName,
							id: interaction.user.id
						}
						// if listener for previous selected option is still open, close it
						if (listener) {
							listener.close();
						}
						// wait for beggar to submit request
						listener = createApprovalListener(interaction, beggar, collector, listenSuccess);
					}
				}
			} else if (i.customId.startsWith(`nickname-victim`)) {
				if (utils.guardReply(i)) {
					// display the clicked option as the selected value
					selectedVictimId = i.values[0];
					const updatedVictimRow = utils.createUpdatedSelectMenu(`nickname-victim-${interaction.user.id}`, victimOptions, selectedVictimId)
					let components = [updatedVictimRow, approverRow];

					if (selectedApproverId) {
						// reconstruct approver select menu with selected option
						// render submit button as well
						const updatedApproverRow = utils.createUpdatedSelectMenu(`nickname-approver-${interaction.user.id}`, approverOptions, selectedApproverId);
						components = [updatedVictimRow, updatedApproverRow, submitRow];
					}

					await i.update({ 
						content: `<@${interaction.user.id}> is begging to change <@${selectedVictimId}>'s name to ${interaction.options.getString("nickname")}!`, 
						components: components
					});

					if (selectedApproverId && selectedVictimId) {
						// create beggar object to verify who sent the original request
						let beggar = {
							displayName: displayName,
							id: interaction.user.id
						}
						if (listener) {
							listener.close();
						}
						// wait for beggar to submit request
						listener = createApprovalListener(interaction, beggar, collector, listenSuccess);
					}
				}
			}
		});

		collector.once('end', collected => {
			if (!listenSuccess.status) system.dbActiveEvents.removeById(commandId);
		});

		await interaction.reply({ components: [victimRow, approverRow] });
	},
};