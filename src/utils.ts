import fs from 'node:fs';
import path from 'node:path';
import { Routes, Collection, Embed, ActionRowBuilder, SelectMenuBuilder, TextInputBuilder, Client, SlashCommandBuilder, ChatInputCommandInteraction, StringSelectMenuBuilder } from 'discord.js';
import { BankAccount, System } from './systems';

export type AppCommand = {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction, system: System, userAccount?: BankAccount) => any
}

export const getCommands = function(): Collection<string, AppCommand> {
  const commands = new Collection<string, AppCommand>();
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command: AppCommand = require(filePath);
    commands.set(command.data.name, command);
  }
  return commands;
}

// export const guardReply = async function(interaction, commandName, matchId) {
//   // if matchId is not specified, the guard will reject interactions that are not related to the interacting user
//   // ie. the customId does not match the interacting user id.
//   let userId = matchId ? matchId : interaction.user.id;
//   let customId = interaction.customId;
//   if (customId.endsWith(userId)) {
//     return true;
//   } else {
//     await interaction.reply({
//       content: "You are not worthy.",
//       ephemeral: true
//     })
//     return false;
//   }
// }

// export const initSingletonCommand = async function(interaction, system) {
//   const commandId = `${interaction.commandName}-${interaction.user.id}`;
//   if (system.dbActiveEvents.getById(commandId)) {
//     try {
//       await interaction.reply({
//         content: `You can only have one /${interaction.commandName} command open at once.`,
//         ephemeral: true
//       });
//     } catch (error) {
//       console.error(error);
//     } finally {
//       return false;
//     }
//   } else {
//     system.dbActiveEvents.store(commandId);
//     return commandId;
//   }
}

export const createSelectMenu = function(customId: string, options: string[], placeholder: string) {
  let selectMenu = new StringSelectMenuBuilder();
  selectMenu.setCustomId(customId);
  selectMenu.addOptions(...options); // TODO
  if (placeholder) selectMenu.setPlaceholder(placeholder);
  return new ActionRowBuilder().addComponents(selectMenu);
}

export const createUpdatedSelectMenu = function(customId: string, options: string[], selectedValue: string) {
  let newOptions = structuredClone(options);
  let selectedOption = newOptions.find(option => option.value === selectedValue);
  selectedOption.default = true;

  // reconstruct the select menu, this time updating the selected value
  return createSelectMenu(customId, newOptions);
}

export const createInputField = function(customId: string, placeholder, min, max) {
  let inputField = new TextInputBuilder();
  inputField.setCustomId(customId);
  inputField.setPlaceholder(placeholder);
  if (min !== undefined) inputField.setMinLength(min);
  if (max !== undefined) inputField.setMaxLength(max);
  return new ActionRowBuilder().addComponents(inputField);
}

export const Time = {
  MINUTE5: 1000 * 60 * 5,
  MINUTE15: 1000 * 60 * 15,
  MINUTE30: 1000 * 60 * 30,
  HOUR1: 1000 * 60 * 60,
  HOUR2: 1000 * 60 * 60 * 2,
  HOUR4: 1000 * 60 * 60 * 4,
  HOUR8: 1000 * 60 * 60 * 8,
  DAY1: 1000 * 60 * 60 * 24,
  DAY3: 1000 * 60 * 60 * 24 * 3,
  WEEK1: 1000 * 60 * 60 * 24 * 7,
}

export const Units = {
  bank: "Emporeum",
  bankPrefix: "**𝔼**",
  slum: "SlumCoin"
}

// module.exports = {
//   getCommands, guardReply, initSingletonCommand, createSelectMenu, createUpdatedSelectMenu, createInputField, Time, Units
// }