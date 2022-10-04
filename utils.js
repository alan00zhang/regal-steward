const fs = require('node:fs');
const path = require('node:path');
const { Routes, Collection, Embed, ActionRowBuilder, SelectMenuBuilder } = require('discord.js');

const getCommands = function(client) {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
  }
}

const guardReply = async function(interaction, commandName, matchId) {
  // if matchId is not specified, the guard will reject interactions that are not related to the interacting user
  // ie. the customId does not match the interacting user id.
  let userId = matchId ? matchId : interaction.user.id;
  let customId = interaction.customId;
  if (customId.endsWith(userId)) {
    return true;
  } else {
    await interaction.reply({
      content: "You are not worthy.",
      ephemeral: true
    })
    return false;
  }
}

const initSingletonCommand = async function(interaction, system) {
  const commandId = `${interaction.commandName}-${interaction.user.id}`;
  if (system.dbActiveEvents.getById(commandId)) {
    try {
      await interaction.reply({
        content: `You can only have one /${interaction.commandName} command open at once.`,
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
    } finally {
      return false;
    }
  } else {
    system.dbActiveEvents.store(commandId);
    return commandId;
  }
}

const createSelectMenu = function(customId, options, placeholder) {
  let selectMenu = new SelectMenuBuilder()
  selectMenu.setCustomId(customId);
  selectMenu.addOptions(...options);
  if (placeholder) selectMenu.setPlaceholder(placeholder);
  return new ActionRowBuilder().addComponents(selectMenu);
}

const createUpdatedSelectMenu = function(customId, options, selectedValue) {
  let newOptions = structuredClone(options)
  let selectedOption = newOptions.find(option => option.value === selectedValue)
  selectedOption.default = true;

  // reconstruct the select menu, this time updating the selected value
  return createSelectMenu(customId, newOptions);
}

const Time = {
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

const Units = {
  bank: "Emporeum",
  bankPrefix: "**𝔼**",
  slum: "SlumCoin"
}

module.exports = {
  getCommands, guardReply, initSingletonCommand, createSelectMenu, createUpdatedSelectMenu, Time, Units
}