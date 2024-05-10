import { System } from '../systems/systems.js';
import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { Utils } from '../utils.js';
import { BankAccount } from '../systems/bank.js';
import { AppCommand } from '../types.js';

export const CommandTip: AppCommand = {
	async execute(interaction: ChatInputCommandInteraction, system: System) {
    let bankAccount = await system.bank.getUserAccount((<GuildMember>interaction.member).id);
    const tip = Math.round(interaction.options.getNumber("amount") * 1e2) / 1e2;
    const tippee = interaction.options.getUser("recipient");

    if (tippee.bot) {
      await interaction.reply({
        content: "Do NOT tip a bot. NO.",
        ephemeral: true
      });
      return;
    }
    if (bankAccount.bankBalance < tip || tip < 0) {
      await interaction.reply({
        content: "You can't afford that.",
        ephemeral: true
      });
      return;
    }
    let recipientAccount = await system.bank.getUserAccount(
      tippee.id
    )
    await bankAccount.subtractBank(tip * 100);
    await recipientAccount.addBank(tip * 100);
    let member = <GuildMember>interaction.member;

		await interaction.reply({
      content: `<@${member.id}> tipped <@${tippee.id}> ${Utils.Units.bankPrefix} ${Number(tip).toLocaleString(undefined, {minimumFractionDigits: 2})}`
    });
    
		await interaction.followUp({
      content: `You have ${bankAccount.bankBalanceString} ${Utils.Units.bank} left in your account.`,
      ephemeral: true
    });
    return;
	},
};