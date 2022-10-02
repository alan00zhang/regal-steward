const { SlashCommandBuilder } = require('discord.js');
const utils = require('../utils.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tip')
		.setDescription(`Tip someone in ${utils.Units.bank}`)
    .addUserOption(option => 
      option.setName("recipient")
        .setDescription("Who will you tip? (Don't tip a bot)")
        .setRequired(true))
    .addNumberOption(option => 
      option.setName("amount")
        .setDescription(`How much ${utils.Units.bank} will you tip?`)
        .setRequired(true)),
	async execute(interaction, userAccount) {
    const tip = interaction.options.getNumber("amount").toFixed(2);
    const tipee = interaction.options.getUser("recipient");
    if (tipee.bot) {
      await interaction.reply({
        content: "Do NOT tip a bot. NO.",
        ephemeral: true
      });
      return;
    }
    if (userAccount.userData.bank_amount / 100 < tip) {
      await interaction.reply({
        content: "You can't afford that.",
        ephemeral: true
      });
      return;
    }
    let recipientAccount = await interaction.client.system.bank.getUserAccount(
      tipee.id
    )
    await Promise.all([
      userAccount.subtractBank(tip * 100),
      recipientAccount.addBank(tip * 100)
    ])
		await interaction.reply({
      content: `<@${interaction.member.id}> tipped <@${tipee.id}> ${tip.toLocaleString(undefined, {minimumFractionDigits: 2})} ${utils.Units.bank}`
    });
		await interaction.followUp({
      content: `You have ${userAccount.bankBalance} ${utils.Units.bank} left in your account.`,
      ephemeral: true
    });
    return;
	},
};